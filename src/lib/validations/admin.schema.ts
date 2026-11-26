import { DiscountType, InventoryMovementReason } from "@prisma/client";
import { z } from "zod";
import { emailSchema } from "./auth.schema";

export const inventoryAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  delta: z
    .number()
    .int()
    .refine((val) => val !== 0, "Stock adjustment cannot be zero."),
  reason: z.enum([
    InventoryMovementReason.RESTOCK,
    InventoryMovementReason.ADJUSTMENT,
  ]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const couponUpsertSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Coupon code must be at least 3 characters.")
      .max(40)
      .toUpperCase(),
    description: z.string().trim().max(300).optional().or(z.literal("")),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive("Discount value must be positive."),
    minOrderAmount: z.number().nonnegative().nullable().optional(),
    maxDiscountAmount: z.number().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    perCustomerLimit: z.number().int().positive().nullable().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.discountType !== DiscountType.PERCENTAGE || data.discountValue <= 100,
    {
      message: "Percentage discount cannot exceed 100%.",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) =>
      !data.startsAt || !data.expiresAt || data.expiresAt > data.startsAt,
    {
      message: "Expiration date must be after start date.",
      path: ["expiresAt"],
    }
  );

export const homepageSectionUpdateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(400).nullable().optional(),
  bodyText: z.string().trim().max(2000).nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(80).nullable().optional(),
  ctaHref: z.string().trim().max(200).nullable().optional(),
  secondaryCtaLabel: z.string().trim().max(80).nullable().optional(),
  secondaryCtaHref: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0),
  isVisible: z.boolean(),
});

export const promotionalBannerSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: z.string().trim().max(200).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  placement: z.string().trim().min(2).max(60).default("HOMEPAGE_MID"),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const storeSettingsSchema = z.object({
  brandName: z.string().trim().min(2).max(120),
  contactEmail: emailSchema,
  contactPhone: z.string().trim().min(5).max(30),
  storeAddress: z.string().trim().min(5).max(300),
  currencyCode: z.string().trim().length(3).toUpperCase(),
  currencySymbol: z.string().trim().min(1).max(5),
  taxRatePercent: z.number().min(0).max(50),
  freeShippingThreshold: z.number().min(0),
  defaultShippingFee: z.number().min(0),
  defaultLowStockThreshold: z.number().int().min(0).max(500),
  returnWindowDays: z.number().int().min(1).max(90),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});
