import type { OrderStatus } from "@prisma/client";

/** Forward flow shown on the customer timeline. */
export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

/** Allowed transitions (admin). Terminal states have no outgoing edges. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["placed", "cancelled"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** Customers may cancel only while the order is not yet packed. */
export function customerCanCancel(status: OrderStatus): boolean {
  return status === "placed" || status === "confirmed" || status === "pending_payment";
}

export function isTerminal(status: OrderStatus) {
  return TRANSITIONS[status].length === 0;
}

/** Index in the forward flow, for rendering progress; -1 for cancelled/returned/pending */
export function flowIndex(status: OrderStatus): number {
  return ORDER_FLOW.indexOf(status);
}

/** Whether a prepaid, cancelled order should be flagged for refund. */
export function needsRefund(input: {
  paymentMethod: "razorpay" | "cod";
  paymentStatus: string;
  newStatus: OrderStatus;
}) {
  return (
    input.paymentMethod === "razorpay" &&
    input.paymentStatus === "paid" &&
    (input.newStatus === "cancelled" || input.newStatus === "returned")
  );
}
