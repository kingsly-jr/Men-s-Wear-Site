import { InventoryMovementReason, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  InsufficientStockError,
  NotFoundError,
} from "@/lib/constants/errors";

export async function listInventoryVariants(params?: {
  q?: string;
  filter?: "all" | "low_stock" | "out_of_stock";
}) {
  const where: Prisma.ProductVariantWhereInput = {};
  if (params?.q) {
    where.OR = [
      { sku: { contains: params.q, mode: "insensitive" } },
      { product: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  const variants = await prisma.productVariant.findMany({
    where,
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    include: {
      size: true,
      color: true,
      product: {
        select: { id: true, name: true, slug: true, status: true },
      },
    },
  });

  const mapped = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    productId: v.productId,
    productName: v.product.name,
    productSlug: v.product.slug,
    productStatus: v.product.status,
    sizeName: v.size.name,
    colorName: v.color.name,
    colorHex: v.color.hexCode,
    stock: v.stock,
    lowStockThreshold: v.lowStockThreshold,
    isActive: v.isActive,
    isOutOfStock: v.stock === 0,
    isLowStock: v.stock > 0 && v.stock <= v.lowStockThreshold,
  }));

  if (params?.filter === "out_of_stock") {
    return mapped.filter((v) => v.isOutOfStock);
  }
  if (params?.filter === "low_stock") {
    return mapped.filter((v) => v.isLowStock);
  }
  return mapped;
}

export async function listInventoryMovements(limit = 100) {
  return prisma.inventoryMovement.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      variant: {
        select: {
          sku: true,
          product: { select: { name: true } },
          size: { select: { name: true } },
          color: { select: { name: true } },
        },
      },
      actor: { select: { name: true, email: true } },
    },
  });
}

/**
 * Atomically adjusts variant stock inside a transaction and appends an immutable InventoryMovement record.
 */
export async function adjustVariantStock(params: {
  adminUserId: string;
  variantId: string;
  delta: number;
  reason: InventoryMovementReason;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: params.variantId },
      select: { id: true, sku: true, stock: true },
    });

    if (!variant) {
      throw new NotFoundError("Product variant not found.");
    }

    const nextStock = variant.stock + params.delta;
    if (nextStock < 0) {
      throw new InsufficientStockError(
        `Cannot reduce stock below 0 (current stock: ${variant.stock}).`
      );
    }

    const updated = await tx.productVariant.update({
      where: { id: variant.id },
      data: { stock: nextStock },
    });

    await tx.inventoryMovement.create({
      data: {
        variantId: variant.id,
        delta: params.delta,
        balanceAfter: nextStock,
        reason: params.reason,
        actorUserId: params.adminUserId,
        note: params.note || null,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: "ADJUST_INVENTORY",
        entityType: "ProductVariant",
        entityId: variant.id,
        details: `Adjusted ${variant.sku} by ${params.delta} (new balance: ${nextStock})`,
      },
    });

    return updated;
  });
}
