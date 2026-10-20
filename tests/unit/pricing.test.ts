import { describe, it, expect } from "vitest";
import {
  computeTotals,
  effectivePrice,
  clampQuantity,
  computeDelivery,
  toPaise,
  MAX_QTY_PER_LINE,
} from "@/lib/pricing";

const rules = { deliveryCharge: 49, freeDeliveryThreshold: 999 };

describe("effectivePrice", () => {
  it("uses discount price when lower than price", () => {
    expect(effectivePrice({ price: 1000, discountPrice: 800 })).toBe(800);
  });
  it("ignores null/zero/higher discount", () => {
    expect(effectivePrice({ price: 1000, discountPrice: null })).toBe(1000);
    expect(effectivePrice({ price: 1000, discountPrice: 0 })).toBe(1000);
    expect(effectivePrice({ price: 1000, discountPrice: 1200 })).toBe(1000);
  });
});

describe("clampQuantity", () => {
  it("clamps to [1, MAX] and stock", () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(-5, 10)).toBe(1);
    expect(clampQuantity(50, 100)).toBe(MAX_QTY_PER_LINE);
    expect(clampQuantity(5, 3)).toBe(3);
    expect(clampQuantity(2.7, 10)).toBe(2);
    expect(clampQuantity(Number.NaN, 10)).toBe(1);
  });
  it("returns 1 when stock is 0 (caller shows out-of-stock)", () => {
    expect(clampQuantity(3, 0)).toBe(1);
  });
});

describe("computeDelivery", () => {
  it("charges below threshold, free at/above threshold, zero for empty cart", () => {
    expect(computeDelivery(500, rules)).toBe(49);
    expect(computeDelivery(999, rules)).toBe(0);
    expect(computeDelivery(1500, rules)).toBe(0);
    expect(computeDelivery(0, rules)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("computes subtotal, discount, delivery and total", () => {
    const t = computeTotals(
      [
        { price: 500, discountPrice: 400, quantity: 2 }, // 800 (saves 200)
        { price: 100, discountPrice: null, quantity: 1 }, // 100
      ],
      rules,
    );
    expect(t.subtotal).toBe(1100);
    expect(t.itemsTotal).toBe(900);
    expect(t.discount).toBe(200);
    expect(t.deliveryCharge).toBe(49);
    expect(t.total).toBe(949);
    expect(t.itemCount).toBe(3);
  });
  it("applies free delivery when items total meets threshold", () => {
    const t = computeTotals([{ price: 1200, discountPrice: 999, quantity: 1 }], rules);
    expect(t.deliveryCharge).toBe(0);
    expect(t.total).toBe(999);
  });
  it("ignores lines with zero quantity and handles empty carts", () => {
    expect(computeTotals([{ price: 100, quantity: 0 }], rules).total).toBe(0);
    expect(computeTotals([], rules)).toMatchObject({
      subtotal: 0,
      total: 0,
      itemCount: 0,
      deliveryCharge: 0,
    });
  });
  it("rounds to paise correctly", () => {
    const t = computeTotals([{ price: 33.335, quantity: 3 }], rules);
    expect(t.subtotal).toBe(100.01);
    expect(toPaise(t.total)).toBe(14901);
  });
});
