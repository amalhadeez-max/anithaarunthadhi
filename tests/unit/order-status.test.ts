import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatuses,
  customerCanCancel,
  isTerminal,
  flowIndex,
  needsRefund,
  ORDER_FLOW,
} from "@/lib/order-status";

describe("order status transitions", () => {
  it("follows the forward flow", () => {
    for (let i = 0; i < ORDER_FLOW.length - 1; i++) {
      expect(canTransition(ORDER_FLOW[i], ORDER_FLOW[i + 1])).toBe(true);
    }
  });
  it("cannot skip backwards or jump ahead arbitrarily", () => {
    expect(canTransition("delivered", "placed")).toBe(false);
    expect(canTransition("placed", "delivered")).toBe(false);
    expect(canTransition("packed", "confirmed")).toBe(false);
  });
  it("allows cancellation before shipping only", () => {
    expect(canTransition("placed", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
    expect(canTransition("packed", "cancelled")).toBe(true);
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("out_for_delivery", "cancelled")).toBe(false);
  });
  it("allows returns from shipped onwards", () => {
    expect(canTransition("shipped", "returned")).toBe(true);
    expect(canTransition("delivered", "returned")).toBe(true);
    expect(canTransition("placed", "returned")).toBe(false);
  });
  it("terminal states have no outgoing transitions", () => {
    expect(nextStatuses("cancelled")).toEqual([]);
    expect(nextStatuses("returned")).toEqual([]);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("delivered")).toBe(false); // delivered → returned still possible
  });
  it("pending payment can be placed (manual confirm) or cancelled", () => {
    expect(nextStatuses("pending_payment").sort()).toEqual(["cancelled", "placed"]);
  });
});

describe("customer cancellation", () => {
  it("is only allowed while placed / confirmed / pending", () => {
    expect(customerCanCancel("placed")).toBe(true);
    expect(customerCanCancel("confirmed")).toBe(true);
    expect(customerCanCancel("pending_payment")).toBe(true);
    expect(customerCanCancel("packed")).toBe(false);
    expect(customerCanCancel("shipped")).toBe(false);
    expect(customerCanCancel("delivered")).toBe(false);
  });
});

describe("flowIndex", () => {
  it("maps forward statuses to their index and others to -1", () => {
    expect(flowIndex("placed")).toBe(0);
    expect(flowIndex("delivered")).toBe(5);
    expect(flowIndex("cancelled")).toBe(-1);
    expect(flowIndex("pending_payment")).toBe(-1);
  });
});

describe("needsRefund", () => {
  it("flags prepaid + paid orders that are cancelled/returned", () => {
    expect(needsRefund({ paymentMethod: "razorpay", paymentStatus: "paid", newStatus: "cancelled" })).toBe(
      true,
    );
    expect(needsRefund({ paymentMethod: "razorpay", paymentStatus: "paid", newStatus: "returned" })).toBe(
      true,
    );
  });
  it("does not flag COD or unpaid or non-cancel transitions", () => {
    expect(needsRefund({ paymentMethod: "cod", paymentStatus: "paid", newStatus: "cancelled" })).toBe(false);
    expect(needsRefund({ paymentMethod: "razorpay", paymentStatus: "pending", newStatus: "cancelled" })).toBe(
      false,
    );
    expect(needsRefund({ paymentMethod: "razorpay", paymentStatus: "paid", newStatus: "shipped" })).toBe(
      false,
    );
  });
});
