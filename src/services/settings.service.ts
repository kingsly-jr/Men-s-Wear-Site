import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { storeSettingsSchema } from "@/lib/validations/admin.schema";

export interface StoreSettingsDTO {
  id: string;
  brandName: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  currencyCode: string;
  currencySymbol: string;
  taxRatePercent: number;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  defaultLowStockThreshold: number;
  returnWindowDays: number;
}

export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  const settings = await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return {
    id: settings.id,
    brandName: settings.brandName,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    storeAddress: settings.storeAddress,
    currencyCode: settings.currencyCode,
    currencySymbol: settings.currencySymbol,
    taxRatePercent: Number(settings.taxRatePercent),
    freeShippingThreshold: Number(settings.freeShippingThreshold),
    defaultShippingFee: Number(settings.defaultShippingFee),
    defaultLowStockThreshold: settings.defaultLowStockThreshold,
    returnWindowDays: settings.returnWindowDays,
  };
}

export async function updateStoreSettings(
  adminUserId: string,
  input: z.infer<typeof storeSettingsSchema>
): Promise<StoreSettingsDTO> {
  const updated = await prisma.$transaction(async (tx) => {
    const rec = await tx.storeSettings.upsert({
      where: { id: "default" },
      update: {
        brandName: input.brandName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        storeAddress: input.storeAddress,
        currencyCode: input.currencyCode,
        currencySymbol: input.currencySymbol,
        taxRatePercent: input.taxRatePercent,
        freeShippingThreshold: input.freeShippingThreshold,
        defaultShippingFee: input.defaultShippingFee,
        defaultLowStockThreshold: input.defaultLowStockThreshold,
        returnWindowDays: input.returnWindowDays,
      },
      create: {
        id: "default",
        ...input,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "UPDATE_STORE_SETTINGS",
        entityType: "StoreSettings",
        entityId: rec.id,
        details: `Updated store configuration (${rec.currencyCode}, tax ${rec.taxRatePercent}%)`,
      },
    });

    return rec;
  });

  return {
    id: updated.id,
    brandName: updated.brandName,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    storeAddress: updated.storeAddress,
    currencyCode: updated.currencyCode,
    currencySymbol: updated.currencySymbol,
    taxRatePercent: Number(updated.taxRatePercent),
    freeShippingThreshold: Number(updated.freeShippingThreshold),
    defaultShippingFee: Number(updated.defaultShippingFee),
    defaultLowStockThreshold: updated.defaultLowStockThreshold,
    returnWindowDays: updated.returnWindowDays,
  };
}

export async function recordAdminActivity(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
}): Promise<void> {
  await prisma.adminActivityLog.create({
    data: {
      adminUserId: params.adminUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
    },
  });
}
