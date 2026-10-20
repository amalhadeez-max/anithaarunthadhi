/**
 * Pure cart / pricing helpers (unit-tested). All amounts are in INR rupees as numbers.
 */
export type PriceableItem = {
  price: number;
  discountPrice?: number | null;
  quantity: number;
};

export type PricingRules = {
  deliveryCharge: number;
  freeDeliveryThreshold: number;
};

export type CartTotals = {
  /** Sum of list price × qty */
  subtotal: number;
  /** Total savings (list − effective) */
  discount: number;
  /** Sum of effective price × qty */
  itemsTotal: number;
  deliveryCharge: number;
  total: number;
  itemCount: number;
};

export const MAX_QTY_PER_LINE = 10;

export function effectivePrice(item: Pick<PriceableItem, "price" | "discountPrice">): number {
  const d = item.discountPrice;
  return d !== null && d !== undefined && d > 0 && d < item.price ? d : item.price;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function clampQuantity(qty: number, stock: number | undefined = Number.POSITIVE_INFINITY): number {
  const q = Math.floor(Number.isFinite(qty) ? qty : 1);
  return Math.max(1, Math.min(q, MAX_QTY_PER_LINE, stock <= 0 ? 1 : stock));
}

export function computeDelivery(itemsTotal: number, rules: PricingRules): number {
  if (itemsTotal <= 0) return 0;
  return itemsTotal >= rules.freeDeliveryThreshold ? 0 : rules.deliveryCharge;
}

export function computeTotals(items: PriceableItem[], rules: PricingRules): CartTotals {
  let subtotal = 0;
  let itemsTotal = 0;
  let itemCount = 0;
  for (const it of items) {
    if (it.quantity <= 0) continue;
    subtotal += it.price * it.quantity;
    itemsTotal += effectivePrice(it) * it.quantity;
    itemCount += it.quantity;
  }
  const deliveryCharge = computeDelivery(itemsTotal, rules);
  return {
    subtotal: round2(subtotal),
    discount: round2(subtotal - itemsTotal),
    itemsTotal: round2(itemsTotal),
    deliveryCharge: round2(deliveryCharge),
    total: round2(itemsTotal + deliveryCharge),
    itemCount,
  };
}

/** Razorpay wants the amount in paise (integer). */
export function toPaise(rupees: number) {
  return Math.round(rupees * 100);
}
