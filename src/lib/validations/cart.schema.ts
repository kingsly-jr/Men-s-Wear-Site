import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.string().uuid("Select a valid product variant."),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(20),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0, "Quantity cannot be negative.").max(20),
});

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Enter a coupon code.")
    .max(40)
    .toUpperCase(),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().uuid("Invalid product ID."),
});

export const moveToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid("Please select a size and color variant."),
  quantity: z.number().int().min(1).max(20).default(1),
});
