import { UserRole } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/constants/errors";
import type {
  addressSchema,
  updateProfileSchema,
} from "@/lib/validations/auth.schema";

export async function getCustomerProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      emailVerifiedAt: true,
      createdAt: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      },
      _count: {
        select: { orders: true },
      },
    },
  });

  if (!user) throw new NotFoundError("Account not found.");
  return user;
}

export async function updateCustomerProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
    },
  });
}

export async function createCustomerAddress(
  userId: string,
  input: z.infer<typeof addressSchema>
) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        label: input.label || null,
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        isDefault: Boolean(input.isDefault),
      },
    });
  });
}

export async function deleteCustomerAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new NotFoundError("Address not found.");
  await prisma.address.delete({ where: { id: addressId } });
}

// --- Admin Customer Management (Strict Privacy: Never exposes passwordHash/tokens) ---

export async function listAdminCustomers(q?: string) {
  const customers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      emailVerifiedAt: true,
      createdAt: true,
      orders: {
        select: { totalAmount: true },
      },
    },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    isActive: c.isActive,
    emailVerifiedAt: c.emailVerifiedAt,
    createdAt: c.createdAt,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }));
}

export async function getAdminCustomerDetail(customerId: string) {
  const customer = await prisma.user.findFirst({
    where: { id: customerId, role: UserRole.CUSTOMER },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      emailVerifiedAt: true,
      createdAt: true,
      addresses: true,
      orders: {
        orderBy: { placedAt: "desc" },
        include: { paymentRecord: true },
      },
    },
  });

  if (!customer) throw new NotFoundError("Customer not found.");
  return customer;
}

export async function toggleCustomerActiveStatus(params: {
  adminUserId: string;
  customerId: string;
  isActive: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: params.customerId },
      data: { isActive: params.isActive },
      select: { id: true, email: true, isActive: true },
    });

    if (!params.isActive) {
      await tx.session.deleteMany({ where: { userId: params.customerId } });
    }

    await tx.adminActivityLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.isActive ? "ACTIVATE_CUSTOMER" : "DEACTIVATE_CUSTOMER",
        entityType: "User",
        entityId: params.customerId,
        details: `Set customer ${updated.email} active=${params.isActive}`,
      },
    });

    return updated;
  });
}
