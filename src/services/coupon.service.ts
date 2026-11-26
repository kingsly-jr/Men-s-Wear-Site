import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/constants/errors";
import { calculateCouponDiscount } from "@/lib/utils/pricing";
import type { couponUpsertSchema } from "@/lib/validations/admin.schema";

type DbClient = Prisma.TransactionClient | typeof prisma;

export interface ValidatedCouponResult {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  discountAmount: number;
}

/**
 * Validates coupon eligibility server-side against dates, minimum spend, global limit, and per-customer limit.
 */
export async function validateCouponForSubtotal(params: {
  code: string;
  subtotal: number;
  userId?: string | null;
  db?: DbClient;
}): Promise<ValidatedCouponResult> {
  const db = params.db ?? prisma;
  const normalizedCode = params.code.trim().toUpperCase();

  const coupon = await db.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon || !coupon.isActive) {
    throw new ValidationError("Coupon code is invalid or inactive.");
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ValidationError("This coupon is not active yet.");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new ValidationError("This coupon has expired.");
  }

  const minOrderAmount = coupon.minOrderAmount
    ? Number(coupon.minOrderAmount)
    : null;
  if (minOrderAmount !== null && params.subtotal < minOrderAmount) {
    throw new ValidationError(
      `Minimum order amount of ${minOrderAmount} is required for coupon ${coupon.code}.`
    );
  }

  if (coupon.usageLimit !== null) {
    const totalUsages = await db.couponUsage.count({
      where: { couponId: coupon.id },
    });
    if (totalUsages >= coupon.usageLimit) {
      throw new ValidationError("This coupon has reached its global usage limit.");
    }
  }

  if (params.userId && coupon.perCustomerLimit !== null) {
    const customerUsages = await db.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: params.userId,
      },
    });
    if (customerUsages >= coupon.perCustomerLimit) {
      throw new ValidationError(
        "You have already reached the usage limit for this coupon."
      );
    }
  }

  const discountValue = Number(coupon.discountValue);
  const maxDiscountAmount = coupon.maxDiscountAmount
    ? Number(coupon.maxDiscountAmount)
    : null;

  const discountAmount = calculateCouponDiscount(params.subtotal, {
    discountType: coupon.discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
  });

  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    discountAmount,
  };
}

export async function listAdminCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });

  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
    usageLimit: c.usageLimit,
    perCustomerLimit: c.perCustomerLimit,
    usedCount: c._count.usages,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    createdAt: c.createdAt,
  }));
}

export async function createCoupon(
  adminUserId: string,
  input: z.infer<typeof couponUpsertSchema>
) {
  const existing = await prisma.coupon.findUnique({
    where: { code: input.code },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("A coupon with this code already exists.");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.coupon.create({
      data: {
        code: input.code,
        description: input.description || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: input.minOrderAmount ?? null,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        usageLimit: input.usageLimit ?? null,
        perCustomerLimit: input.perCustomerLimit ?? 1,
        startsAt: input.startsAt ?? null,
        expiresAt: input.expiresAt ?? null,
        isActive: input.isActive,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "CREATE_COUPON",
        entityType: "Coupon",
        entityId: created.id,
        details: `Created coupon ${created.code}`,
      },
    });

    return created;
  });
}

export async function updateCoupon(
  adminUserId: string,
  couponId: string,
  input: z.infer<typeof couponUpsertSchema>
) {
  const existing = await prisma.coupon.findUnique({
    where: { id: couponId },
  });
  if (!existing) {
    throw new NotFoundError("Coupon not found.");
  }

  if (existing.code !== input.code) {
    const duplicate = await prisma.coupon.findUnique({
      where: { code: input.code },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictError("Another coupon already uses this code.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coupon.update({
      where: { id: couponId },
      data: {
        code: input.code,
        description: input.description || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: input.minOrderAmount ?? null,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        usageLimit: input.usageLimit ?? null,
        perCustomerLimit: input.perCustomerLimit ?? 1,
        startsAt: input.startsAt ?? null,
        expiresAt: input.expiresAt ?? null,
        isActive: input.isActive,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "UPDATE_COUPON",
        entityType: "Coupon",
        entityId: updated.id,
        details: `Updated coupon ${updated.code}`,
      },
    });

    return updated;
  });
}

export async function deleteCoupon(adminUserId: string, couponId: string) {
  const usageCount = await prisma.couponUsage.count({
    where: { couponId },
  });
  if (usageCount > 0) {
    throw new ConflictError(
      "Cannot delete a coupon that has already been redeemed on orders. Deactivate it instead."
    );
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.coupon.delete({
      where: { id: couponId },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "DELETE_COUPON",
        entityType: "Coupon",
        entityId: deleted.id,
        details: `Deleted coupon ${deleted.code}`,
      },
    });

    return deleted;
  });
}
