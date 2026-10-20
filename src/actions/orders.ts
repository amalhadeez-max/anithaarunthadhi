"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { checkoutSchema, zodMessage } from "@/lib/validations";
import { computeTotals, effectivePrice, toPaise, clampQuantity } from "@/lib/pricing";
import { customerCanCancel } from "@/lib/order-status";
import { razorpayClient, isRazorpayConfigured, verifyCheckoutSignature } from "@/lib/razorpay";
import {
  generateOrderNumber,
  decrementStock,
  OutOfStockError,
  finalizeRazorpayPayment,
  restockOrder,
  stockReservedStatuses,
} from "@/lib/orders";
import { sendOrderPlacedEmail } from "@/lib/order-emails";
import { assertRateLimit } from "@/lib/rate-limit";
import { toNumber } from "@/lib/utils";
import type { ActionResult, CartLine } from "@/types";
import { productCardInclude, toCartLine } from "@/lib/serializers";

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  paymentMethod: "razorpay" | "cod";
  amount: number;
  razorpay?: { orderId: string; keyId: string; name: string; email: string; contact: string };
};

export async function createOrder(input: unknown): Promise<ActionResult<CreateOrderResult>> {
  try {
    await assertRateLimit("checkout", 10, 10 * 60_000);
    const user = await assertUser();
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { addressId, paymentMethod, items, notes } = parsed.data;
    const settings = await getSiteSettings();

    if (paymentMethod === "cod" && !settings.codEnabled)
      return { ok: false, error: "Cash on delivery is currently unavailable." };
    if (paymentMethod === "razorpay" && !isRazorpayConfigured())
      return { ok: false, error: "Online payment is not configured yet. Please choose Cash on Delivery." };

    const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!address) return { ok: false, error: "Please select a valid delivery address." };

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines = items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new Error("One of the items is no longer available.");
      const qty = clampQuantity(i.quantity, p.stock);
      if (p.stock < i.quantity) throw new OutOfStockError(p.name);
      const price = toNumber(p.price);
      const discountPrice = p.discountPrice ? toNumber(p.discountPrice) : null;
      const unit = effectivePrice({ price, discountPrice });
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        imageUrl: p.images[0]?.url ?? null,
        unitPrice: unit,
        quantity: qty,
        lineTotal: unit * qty,
        price,
        discountPrice,
      };
    });
    const totals = computeTotals(lines, settings);
    if (totals.total <= 0) return { ok: false, error: "Your cart is empty." };

    const shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      label: address.label,
    };

    // Create order (retry on order-number collision)
    let order: { id: string; orderNumber: string } | null = null;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const o = await tx.order.create({
            data: {
              orderNumber: generateOrderNumber(),
              userId: user.id,
              addressId: address.id,
              shippingAddress,
              status: paymentMethod === "cod" ? "placed" : "pending_payment",
              paymentMethod,
              paymentStatus: "pending",
              subtotal: new Prisma.Decimal(totals.subtotal),
              discount: new Prisma.Decimal(totals.discount),
              deliveryCharge: new Prisma.Decimal(totals.deliveryCharge),
              total: new Prisma.Decimal(totals.total),
              notes: notes || null,
              items: {
                create: lines.map((l) => ({
                  productId: l.productId,
                  name: l.name,
                  sku: l.sku,
                  imageUrl: l.imageUrl,
                  unitPrice: new Prisma.Decimal(l.unitPrice),
                  quantity: l.quantity,
                  lineTotal: new Prisma.Decimal(l.lineTotal),
                })),
              },
              payment: {
                create: {
                  provider: paymentMethod,
                  amount: new Prisma.Decimal(totals.total),
                  status: "pending",
                },
              },
            },
          });
          if (paymentMethod === "cod") {
            // COD: reserve stock immediately
            await decrementStock(tx, lines);
            await tx.orderStatusHistory.create({
              data: { orderId: o.id, toStatus: "placed", note: "Order placed (Cash on Delivery)" },
            });
          }
          return { id: o.id, orderNumber: o.orderNumber };
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 4) continue;
        throw e;
      }
    }
    if (!order) throw new Error("Could not create order, please try again.");

    // Clear server cart
    await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } }).catch(() => {});

    if (paymentMethod === "cod") {
      void sendOrderPlacedEmail(settings.storeName, {
        id: order.id,
        orderNumber: order.orderNumber,
        total: totals.total,
        paymentMethod,
        items: lines.map((l) => ({ name: l.name, quantity: l.quantity, lineTotal: l.lineTotal })),
        user: { email: user.email, fullName: user.fullName },
      }).catch(() => {});
      revalidatePath("/orders");
      return {
        ok: true,
        data: { orderId: order.id, orderNumber: order.orderNumber, paymentMethod, amount: totals.total },
      };
    }

    // Razorpay: create gateway order and store its id
    const rzp = razorpayClient();
    const rzpOrder = await rzp.orders.create({
      amount: toPaise(totals.total),
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order.id, orderNumber: order.orderNumber },
    });
    await prisma.payment.update({ where: { orderId: order.id }, data: { razorpayOrderId: rzpOrder.id } });

    return {
      ok: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod,
        amount: totals.total,
        razorpay: {
          orderId: rzpOrder.id,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          name: user.fullName ?? "",
          email: user.email,
          contact: address.phone,
        },
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to place order" };
  }
}

/** Client-side callback from Razorpay Checkout: verify signature and finalize. */
export async function verifyRazorpayPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ActionResult<{ orderId: string }>> {
  try {
    const user = await assertUser();
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, userId: user.id },
      include: { payment: true },
    });
    if (!order || order.payment?.razorpayOrderId !== input.razorpayOrderId)
      return { ok: false, error: "Order mismatch" };
    if (
      !verifyCheckoutSignature({
        orderId: input.razorpayOrderId,
        paymentId: input.razorpayPaymentId,
        signature: input.razorpaySignature,
      })
    ) {
      return { ok: false, error: "Payment signature verification failed" };
    }
    const result = await finalizeRazorpayPayment({
      razorpayOrderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });
    revalidatePath("/orders");
    if (!result)
      return {
        ok: false,
        error: "Payment received but an item went out of stock. A refund has been initiated.",
      };
    return { ok: true, data: { orderId: order.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Verification failed" };
  }
}

export async function cancelOrder(orderId: string, reason?: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
    if (!order) return { ok: false, error: "Order not found" };
    if (!customerCanCancel(order.status))
      return { ok: false, error: "This order can no longer be cancelled. Please contact us." };
    await prisma.$transaction(async (tx) => {
      if (stockReservedStatuses.includes(order.status)) await restockOrder(tx, order.id);
      const refund = order.paymentMethod === "razorpay" && order.paymentStatus === "paid";
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          paymentStatus: refund ? "refund_pending" : order.paymentStatus,
        },
      });
      if (refund)
        await tx.payment.update({ where: { orderId: order.id }, data: { status: "refund_pending" } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "cancelled",
          note: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer",
          changedById: user.id,
          changedByName: user.fullName ?? user.email,
        },
      });
    });
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true, message: "Order cancelled" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to cancel" };
  }
}

/** Returns cart lines for the order's items so the client can add them to the cart. */
export async function reorderLines(orderId: string): Promise<ActionResult<CartLine[]>> {
  try {
    const user = await assertUser();
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: true },
    });
    if (!order) return { ok: false, error: "Order not found" };
    const products = await prisma.product.findMany({
      where: { id: { in: order.items.map((i) => i.productId) }, isActive: true },
      include: productCardInclude,
    });
    const qty = new Map(order.items.map((i) => [i.productId, i.quantity]));
    const lines = products
      .filter((p) => p.stock > 0)
      .map((p) => toCartLine(p, clampQuantity(qty.get(p.id) ?? 1, p.stock)));
    if (!lines.length) return { ok: false, error: "None of these items are available right now." };
    return {
      ok: true,
      data: lines,
      message: `${lines.length} item${lines.length === 1 ? "" : "s"} added to cart`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
