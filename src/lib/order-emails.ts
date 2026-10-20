import "server-only";
import type { OrderStatus } from "@prisma/client";
import { sendEmail, layoutEmail, escapeHtml } from "@/lib/email";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { publicEnv } from "@/lib/env";

type OrderForEmail = {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: "razorpay" | "cod";
  items: { name: string; quantity: number; lineTotal: number }[];
  user: { email: string; fullName: string | null };
};

function itemsTable(items: OrderForEmail["items"]) {
  return `<table width="100%" style="border-collapse:collapse;font-size:14px">${items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(i.name)} × ${i.quantity}</td><td align="right" style="padding:6px 0;border-bottom:1px solid #eee">${formatINR(i.lineTotal)}</td></tr>`,
    )
    .join("")}</table>`;
}

export async function sendOrderPlacedEmail(storeName: string, order: OrderForEmail) {
  const link = `${publicEnv.appUrl}/orders/${order.id}`;
  const html = layoutEmail(
    storeName,
    `Order ${order.orderNumber} confirmed`,
    `<p>Hi ${escapeHtml(order.user.fullName ?? "there")}, thanks for your order!</p>${itemsTable(order.items)}
     <p style="font-size:16px;margin-top:12px"><strong>Total: ${formatINR(order.total)}</strong> · ${order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}</p>
     <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Track your order</a></p>`,
  );
  await sendEmail({
    to: order.user.email,
    subject: `${storeName}: order ${order.orderNumber} confirmed`,
    html,
  });
}

export async function sendOrderStatusEmail(
  storeName: string,
  order: OrderForEmail & { courier?: string | null; trackingNumber?: string | null },
  status: OrderStatus,
  note?: string | null,
) {
  const link = `${publicEnv.appUrl}/orders/${order.id}`;
  const tracking = order.trackingNumber
    ? `<p>Courier: ${escapeHtml(order.courier ?? "")} · Tracking #: <strong>${escapeHtml(order.trackingNumber)}</strong></p>`
    : "";
  const html = layoutEmail(
    storeName,
    `Order ${order.orderNumber}: ${ORDER_STATUS_LABEL[status]}`,
    `<p>Hi ${escapeHtml(order.user.fullName ?? "there")}, your order status is now <strong>${ORDER_STATUS_LABEL[status]}</strong>.</p>
     ${note ? `<p style="color:#555">${escapeHtml(note)}</p>` : ""}${tracking}
     <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View order</a></p>`,
  );
  await sendEmail({
    to: order.user.email,
    subject: `${storeName}: order ${order.orderNumber} ${ORDER_STATUS_LABEL[status].toLowerCase()}`,
    html,
  });
}
