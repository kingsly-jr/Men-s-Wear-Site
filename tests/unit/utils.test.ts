import { describe, expect, test } from "bun:test";
import { formatCurrency, roundMoney } from "../../src/lib/utils/currency";
import { slugify } from "../../src/lib/utils/slug";
import { calculateCouponDiscount } from "../../src/lib/utils/pricing";

describe("Core Utility & Edge Case Tests", () => {
  test("slugify produces clean URL-safe slugs", () => {
    expect(slugify("  Obsidian Heavyweight Tee!  ")).toBe(
      "obsidian-heavyweight-tee"
    );
    expect(slugify("500 GSM --- Hoodie / Black")).toBe(
      "500-gsm-hoodie-black"
    );
  });

  test("roundMoney handles floating-point precision cleanly", () => {
    expect(roundMoney(19.995)).toBe(20);
    expect(roundMoney(100.124)).toBe(100.12);
  });

  test("formatCurrency falls back safely on invalid numeric strings", () => {
    expect(formatCurrency("not-a-number", "INR")).toContain("0");
    expect(formatCurrency(2499, "INR")).toContain("2,499");
  });

  test("fixed coupon never exceeds subtotal", () => {
    const discount = calculateCouponDiscount(500, {
      discountType: "FIXED",
      discountValue: 1200,
    });
    expect(discount).toBe(500);
  });
});
