"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { updateOrderStatusSchema, trackingSchema, zodMessage } from "@/lib/validations";
import { canTransition, needsRefund } from "@/lib/order-status";
import { restockOrder, stockReservedStatuses } from "@/lib/orders";
import { sendOrderStatusEmail } from "@/lib/order-emails";
import { toNumber } from "@/lib/utils";
import type { ActionResult } from "@/types";

function revalidateOrder(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/admin");
}

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    const parsed = updateOrderStatusSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { orderId, status, note } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) return { ok: false, error: "Order not found" };
    if (order.status === status) return { ok: false, error: "Order is already in that status" };
    if (!canTransition(order.status, status))
      return { ok: false, error: `Cannot move from "${order.status}" to "${status}"` };

    const refund = needsRefund({
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      newStatus: status,
    });

    await prisma.$transaction(async (tx) => {
      // Releasing stock when leaving a reserved state into cancelled/returned
      if ((status === "cancelled" || status === "returned") && stockReservedStatuses.includes(order.status))
        await restockOrder(tx, order.id);
      // Admin manually confirming a pending-payment order (e.g. paid by other means) reserves stock
      if (order.status === "pending_payment" && status === "placed") {
        for (const it of order.items)
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { decrement: it.quantity } },
          });
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          ...(status === "delivered"
            ? { deliveredAt: new Date(), ...(order.paymentMethod === "cod" ? { paymentStatus: "paid" } : {}) }
            : {}),
          ...(status === "cancelled" ? { cancelledAt: new Date() } : {}),
          ...(refund ? { paymentStatus: "refund_pending" } : {}),
        },
      });
      if (status === "delivered" && order.paymentMethod === "cod")
        await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "paid" } });
      if (refund)
        await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "refund_pending" } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: status,
          note: note || null,
          changedById: admin.id,
          changedByName: admin.fullName ?? admin.email,
        },
      });
    });

    const s = await getSiteSettings();
    void sendOrderStatusEmail(
      s.storeName,
      {
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
        courier: order.courier,
        trackingNumber: order.trackingNumber,
      },
      status,
      note,
    ).catch(() => {});

    revalidateOrder(order.id);
    return {
      ok: true,
      message: `Status updated to ${status.replace(/_/g, " ")}${refund ? " · refund flagged" : ""}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update status" };
  }
}

export async function updateTracking(input: unknown): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    const parsed = trackingSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { orderId, courier, trackingNumber } = parsed.data;
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { courier: courier || null, trackingNumber: trackingNumber || null },
    });
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: order.status,
        note: `Tracking updated: ${courier || "-"} ${trackingNumber || ""}`.trim(),
        changedById: admin.id,
        changedByName: admin.fullName ?? admin.email,
      },
    });
    revalidateOrder(orderId);
    return { ok: true, message: "Tracking saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Mark a prepaid cancelled/returned order as refunded (after processing the refund in Razorpay dashboard or API). */
export async function markRefunded(orderId: string, refundId?: string): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, error: "Order not found" };
    if (order.paymentMethod !== "razorpay")
      return { ok: false, error: "Only prepaid orders can be refunded" };
    if (!["cancelled", "returned"].includes(order.status))
      return { ok: false, error: "Order must be cancelled or returned first" };
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "refunded" } }),
      prisma.payment.updateMany({
        where: { orderId },
        data: { status: "refunded", refundId: refundId || null, refundedAt: new Date() },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: order.status,
          note: `Refund marked complete${refundId ? ` (${refundId})` : ""}`,
          changedById: admin.id,
          changedByName: admin.fullName ?? admin.email,
        },
      }),
    ]);
    revalidateOrder(orderId);
    return { ok: true, message: "Marked as refunded" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
