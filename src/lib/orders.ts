import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { sendOrderPlacedEmail } from "@/lib/order-emails";
import { toNumber } from "@/lib/utils";

const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateOrderNumber(date = new Date()) {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPH[Math.floor(Math.random() * ALPH.length)];
  return `AN-${d}-${suffix}`;
}

export class OutOfStockError extends Error {
  constructor(public readonly productName: string) {
    super(`"${productName}" is out of stock or has insufficient quantity.`);
  }
}

/**
 * Decrement stock for every line inside the given transaction, guarding with `stock >= qty`.
 * Throws OutOfStockError if any line cannot be satisfied (the caller's transaction rolls back).
 */
export async function decrementStock(
  tx: Prisma.TransactionClient,
  items: { productId: string; quantity: number; name: string }[],
) {
  for (const it of items) {
    const res = await tx.product.updateMany({
      where: { id: it.productId, stock: { gte: it.quantity } },
      data: { stock: { decrement: it.quantity } },
    });
    if (res.count !== 1) throw new OutOfStockError(it.name);
  }
}

/**
 * Mark a Razorpay order as paid (idempotent). Called from the client-side verify action AND the
 * webhook — whichever arrives first wins; the other is a no-op. Stock is reduced here, after
 * verification, inside one transaction.
 */
export async function finalizeRazorpayPayment(input: {
  razorpayOrderId: string;
  paymentId: string;
  signature?: string;
  payload?: unknown;
}) {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
    include: { order: { include: { items: true, user: true } } },
  });
  if (!payment) throw new Error("Payment record not found");
  if (payment.status === "paid") return payment.order; // idempotent

  const order = await prisma.$transaction(async (tx) => {
    try {
      await decrementStock(tx, payment.order.items);
    } catch (e) {
      if (e instanceof OutOfStockError) {
        // Payment captured but stock vanished between checkout and payment → flag for refund.
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "refund_pending",
            razorpayPaymentId: input.paymentId,
            razorpaySignature: input.signature,
            rawPayload: input.payload as Prisma.InputJsonValue,
          },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: "cancelled",
            paymentStatus: "refund_pending",
            cancelledAt: new Date(),
            notes: `Auto-cancelled: ${e.message}`,
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: "pending_payment",
            toStatus: "cancelled",
            note: `Stock unavailable after payment — refund pending. ${e.message}`,
          },
        });
        return null;
      }
      throw e;
    }
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        razorpayPaymentId: input.paymentId,
        razorpaySignature: input.signature,
        rawPayload: input.payload as Prisma.InputJsonValue,
      },
    });
    const o = await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "placed", paymentStatus: "paid" },
      include: { items: true, user: true },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: o.id,
        fromStatus: "pending_payment",
        toStatus: "placed",
        note: `Payment ${input.paymentId} verified`,
      },
    });
    return o;
  });

  if (order) {
    const s = await getSiteSettings();
    void sendOrderPlacedEmail(s.storeName, {
      id: order.id,
      orderNumber: order.orderNumber,
      total: toNumber(order.total),
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        lineTotal: toNumber(i.lineTotal),
      })),
      user: { email: order.user.email, fullName: order.user.fullName },
    }).catch(() => {});
  }
  return order;
}

export async function markRazorpayPaymentFailed(razorpayOrderId: string, payload?: unknown) {
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment || payment.status === "paid") return;
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", rawPayload: payload as Prisma.InputJsonValue },
    }),
    prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "failed" } }),
  ]);
}

/** Restock items when an order is cancelled/returned after stock was reserved. */
export async function restockOrder(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items)
    await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
}

export const stockReservedStatuses: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
];
