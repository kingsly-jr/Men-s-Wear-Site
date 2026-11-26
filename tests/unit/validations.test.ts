import { describe, expect, test } from "bun:test";
import { DiscountType, InventoryMovementReason } from "@prisma/client";
import { registerSchema, addressSchema } from "../../src/lib/validations/auth.schema";
import {
  couponUpsertSchema,
  inventoryAdjustmentSchema,
} from "../../src/lib/validations/admin.schema";
import { checkoutSchema } from "../../src/lib/validations/order.schema";

describe("Zod Validation Schemas", () => {
  test("registerSchema normalizes email and enforces password length", () => {
    const valid = registerSchema.safeParse({
      name: "Rohan Sharma",
      email: "  ROHAN@Example.COM ",
      password: "StrongPassword123",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe("rohan@example.com");
    }

    const shortPw = registerSchema.safeParse({
      name: "Rohan",
      email: "rohan@example.com",
      password: "123",
    });
    expect(shortPw.success).toBe(false);
  });

  test("couponUpsertSchema rejects percentage over 100 and invalid date ranges", () => {
    const over100 = couponUpsertSchema.safeParse({
      code: "bad150",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 120,
    });
    expect(over100.success).toBe(false);

    const badDates = couponUpsertSchema.safeParse({
      code: "DATEFAIL",
      discountType: DiscountType.FIXED,
      discountValue: 500,
      startsAt: "2026-12-10",
      expiresAt: "2026-12-01",
    });
    expect(badDates.success).toBe(false);
  });

  test("inventoryAdjustmentSchema forbids zero delta", () => {
    const zeroDelta = inventoryAdjustmentSchema.safeParse({
      variantId: "550e8400-e29b-41d4-a716-446655440000",
      delta: 0,
      reason: InventoryMovementReason.ADJUSTMENT,
    });
    expect(zeroDelta.success).toBe(false);
  });

  test("checkoutSchema requires either addressId or inline shippingAddress", () => {
    const missingAddress = checkoutSchema.safeParse({
      paymentMethod: "CASH_ON_DELIVERY",
    });
    expect(missingAddress.success).toBe(false);

    const validInline = checkoutSchema.safeParse({
      shippingAddress: addressSchema.parse({
        fullName: "Kabir Verma",
        phone: "9876543210",
        line1: "22 Marine Drive",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400020",
      }),
    });
    expect(validInline.success).toBe(true);
  });
});
