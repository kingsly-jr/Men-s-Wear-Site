import { ProductStatus } from "@prisma/client";
import { z } from "zod";

export const productSpecInputSchema = z.object({
  specKey: z.string().trim().min(1, "Spec name is required.").max(60),
  specValue: z.string().trim().min(1, "Spec value is required.").max(160),
  sortOrder: z.number().int().min(0).default(0),
});

export const productImageInputSchema = z.object({
  url: z.string().trim().url("Provide a valid image URL."),
  altText: z.string().trim().max(160).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const productVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sizeId: z.string().uuid("Select a valid size."),
  colorId: z.string().uuid("Select a valid color."),
  sku: z
    .string()
    .trim()
    .min(3, "Variant SKU is required.")
    .max(64)
    .toUpperCase(),
  priceOverride: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().min(0, "Stock cannot be negative."),
  lowStockThreshold: z.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
});

export const productUpsertSchema = z.object({
  name: z.string().trim().min(2, "Product name is required.").max(160),
  slug: z.string().trim().min(2, "Slug is required.").max(180),
  sku: z.string().trim().min(3, "SKU is required.").max(64).toUpperCase(),
  description: z.string().trim().min(10, "Description is required.").max(4000),
  fabric: z.string().trim().max(200).optional().or(z.literal("")),
  material: z.string().trim().max(200).optional().or(z.literal("")),
  careInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
  price: z.number().positive("Price must be greater than zero."),
  originalPrice: z.number().positive().nullable().optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  categoryId: z.string().uuid("Select a valid category."),
  collectionIds: z.array(z.string().uuid()).default([]),
  specifications: z.array(productSpecInputSchema).default([]),
  images: z
    .array(productImageInputSchema)
    .min(1, "At least one product image is required."),
  variants: z
    .array(productVariantInputSchema)
    .min(1, "At least one product variant is required."),
});

export const bulkProductStatusSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "Select at least one product."),
  status: z.nativeEnum(ProductStatus),
});

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2, "Category name is required.").max(100),
  slug: z.string().trim().min(2, "Slug is required.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL.")
    .optional()
    .or(z.literal("")),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const collectionUpsertSchema = z.object({
  name: z.string().trim().min(2, "Collection name is required.").max(100),
  slug: z.string().trim().min(2, "Slug is required.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL.")
    .optional()
    .or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string().uuid()).optional(),
});

export const catalogFilterSchema = z.object({
  category: z.string().trim().optional(),
  collection: z.string().trim().optional(),
  q: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  inStock: z.coerce.boolean().optional(),
  discounted: z.coerce.boolean().optional(),
  sort: z
    .enum([
      "featured",
      "newest",
      "price_asc",
      "price_desc",
      "best_selling",
      "highest_discount",
    ])
    .default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const productReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3, "Review title is required.").max(120),
  comment: z.string().trim().min(10, "Review must be at least 10 characters.").max(1500),
});
