import { describe, expect, test } from "bun:test";
import { OrderStatus } from "@prisma/client";
import {
  canTransitionOrderStatus,
  isOrderEligibleForCancellation,
  isOrderEligibleForReturn,
} from "../../src/lib/constants/order-status";

describe("Order Status State Machine & Eligibility", () => {
  test("allows valid forward order transitions and prevents backward/terminal transitions", () => {
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.CONFIRMED, OrderStatus.PROCESSING)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.RETURNED)).toBe(true);

    // Invalid jumps / backward / terminal
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.DELIVERED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.PENDING)).toBe(false);
  });

  test("evaluates cancellation eligibility accurately", () => {
    expect(isOrderEligibleForCancellation(OrderStatus.PENDING)).toBe(true);
    expect(isOrderEligibleForCancellation(OrderStatus.CONFIRMED)).toBe(true);
    expect(isOrderEligibleForCancellation(OrderStatus.PROCESSING)).toBe(true);
    expect(isOrderEligibleForCancellation(OrderStatus.SHIPPED)).toBe(false);
    expect(isOrderEligibleForCancellation(OrderStatus.DELIVERED)).toBe(false);
  });

  test("evaluates return window eligibility accurately", () => {
    const now = new Date("2026-11-26T12:00:00Z");
    const fiveDaysAgo = new Date("2026-11-21T12:00:00Z");
    const twentyDaysAgo = new Date("2026-11-06T12:00:00Z");

    expect(
      isOrderEligibleForReturn({
        status: OrderStatus.DELIVERED,
        placedAt: fiveDaysAgo,
        returnWindowDays: 14,
        now,
      })
    ).toBe(true);

    expect(
      isOrderEligibleForReturn({
        status: OrderStatus.DELIVERED,
        placedAt: twentyDaysAgo,
        returnWindowDays: 14,
        now,
      })
    ).toBe(false);

    expect(
      isOrderEligibleForReturn({
        status: OrderStatus.SHIPPED,
        placedAt: fiveDaysAgo,
        returnWindowDays: 14,
        now,
      })
    ).toBe(false);
  });
});
