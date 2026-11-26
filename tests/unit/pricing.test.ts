import { describe, expect, test } from "bun:test";
import {
  calculateCouponDiscount,
  calculateDiscountPercentage,
  calculateOrderTotals,
  resolveEffectivePrice,
} from "../../src/lib/utils/pricing";

describe("Pricing & Order Calculation Utilities", () => {
  test("computes accurate discount percentage", () => {
    expect(calculateDiscountPercentage(1899, 2499)).toBe(24);
    expect(calculateDiscountPercentage(2000, null)).toBe(0);
    expect(calculateDiscountPercentage(2500, 2000)).toBe(0);
  });

  test("resolves variant price override over base price", () => {
    expect(resolveEffectivePrice(3000, null)).toBe(3000);
    expect(resolveEffectivePrice(3000, 3499)).toBe(3499);
  });

  test("enforces coupon minimum order amount and max discount cap", () => {
    const coupon = {
      discountType: "PERCENTAGE" as const,
      discountValue: 15,
      minOrderAmount: 2999,
      maxDiscountAmount: 1500,
    };

    expect(calculateCouponDiscount(2500, coupon)).toBe(0);
    expect(calculateCouponDiscount(4000, coupon)).toBe(600);
    expect(calculateCouponDiscount(20000, coupon)).toBe(1500);
  });

  test("computes server-authoritative order totals with shipping and tax", () => {
    const totals = calculateOrderTotals({
      items: [
        { unitPrice: 1899, quantity: 1 },
        { unitPrice: 1000, quantity: 1 },
      ],
      coupon: {
        discountType: "FIXED",
        discountValue: 400,
      },
      freeShippingThreshold: 2999,
      defaultShippingFee: 199,
      taxRatePercent: 12,
    });

    // subtotal = 2899, discount = 400, discounted = 2499 (< 2999 so shipping = 199)
    // tax = 12% of 2499 = 299.88
    // total = 2499 + 199 + 299.88 = 2997.88
    expect(totals.subtotal).toBe(2899);
    expect(totals.discountAmount).toBe(400);
    expect(totals.shippingAmount).toBe(199);
    expect(totals.taxAmount).toBe(299.88);
    expect(totals.totalAmount).toBe(2997.88);
  });
});
