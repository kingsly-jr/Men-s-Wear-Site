import { roundMoney } from "./currency";

export interface CartCalculationItem {
  unitPrice: number;
  quantity: number;
}

export interface CouponInput {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Computes integer discount percentage given selling price and original MRP.
 */
export function calculateDiscountPercentage(
  price: number,
  originalPrice?: number | null
): number {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) {
    return 0;
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Resolves the effective selling price for a variant (variant override or product base price).
 */
export function resolveEffectivePrice(
  productPrice: number,
  variantPriceOverride?: number | null
): number {
  if (
    variantPriceOverride !== null &&
    variantPriceOverride !== undefined &&
    variantPriceOverride >= 0
  ) {
    return roundMoney(variantPriceOverride);
  }
  return roundMoney(productPrice);
}

/**
 * Computes coupon discount capped by subtotal and optional maxDiscountAmount.
 */
export function calculateCouponDiscount(
  subtotal: number,
  coupon?: CouponInput | null
): number {
  if (!coupon || subtotal <= 0) {
    return 0;
  }

  if (
    coupon.minOrderAmount !== null &&
    coupon.minOrderAmount !== undefined &&
    subtotal < coupon.minOrderAmount
  ) {
    return 0;
  }

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (
    coupon.maxDiscountAmount !== null &&
    coupon.maxDiscountAmount !== undefined
  ) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  discount = Math.max(0, Math.min(discount, subtotal));
  return roundMoney(discount);
}

/**
 * Server-authoritative order & cart total calculation.
 */
export function calculateOrderTotals(params: {
  items: CartCalculationItem[];
  coupon?: CouponInput | null;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  taxRatePercent: number;
}): CartTotals {
  const subtotal = roundMoney(
    params.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );
  const discountAmount = calculateCouponDiscount(subtotal, params.coupon);
  const discountedSubtotal = roundMoney(Math.max(0, subtotal - discountAmount));

  const shippingAmount =
    subtotal <= 0 || discountedSubtotal >= params.freeShippingThreshold
      ? 0
      : roundMoney(params.defaultShippingFee);

  const taxAmount = roundMoney(
    (discountedSubtotal * Math.max(0, params.taxRatePercent)) / 100
  );
  const totalAmount = roundMoney(discountedSubtotal + shippingAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    shippingAmount,
    taxAmount,
    totalAmount,
  };
}
