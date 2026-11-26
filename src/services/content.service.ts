import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type {
  homepageSectionUpdateSchema,
  promotionalBannerSchema,
} from "@/lib/validations/admin.schema";

export async function getVisibleHomepageSections() {
  return prisma.homepageSection.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAllHomepageSections() {
  return prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function updateHomepageSection(
  adminUserId: string,
  sectionKey: string,
  input: z.infer<typeof homepageSectionUpdateSchema>
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.homepageSection.update({
      where: { key: sectionKey },
      data: {
        title: input.title,
        subtitle: input.subtitle ?? null,
        bodyText: input.bodyText ?? null,
        imageUrl: input.imageUrl || null,
        ctaLabel: input.ctaLabel ?? null,
        ctaHref: input.ctaHref ?? null,
        secondaryCtaLabel: input.secondaryCtaLabel ?? null,
        secondaryCtaHref: input.secondaryCtaHref ?? null,
        sortOrder: input.sortOrder,
        isVisible: input.isVisible,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "UPDATE_HOMEPAGE_SECTION",
        entityType: "HomepageSection",
        entityId: updated.id,
        details: `Updated section ${sectionKey}`,
      },
    });

    return updated;
  });
}

export async function listActivePromotionalBanners(placement?: string) {
  return prisma.promotionalBanner.findMany({
    where: {
      isActive: true,
      ...(placement ? { placement } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAdminPromotionalBanners() {
  return prisma.promotionalBanner.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function createPromotionalBanner(
  adminUserId: string,
  input: z.infer<typeof promotionalBannerSchema>
) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.promotionalBanner.create({
      data: {
        title: input.title,
        subtitle: input.subtitle || null,
        ctaLabel: input.ctaLabel || null,
        ctaHref: input.ctaHref || null,
        imageUrl: input.imageUrl || null,
        placement: input.placement,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "CREATE_PROMOTIONAL_BANNER",
        entityType: "PromotionalBanner",
        entityId: created.id,
        details: `Created banner ${created.title}`,
      },
    });

    return created;
  });
}

export async function subscribeToNewsletter(email: string) {
  const normalized = email.trim().toLowerCase();
  return prisma.newsletterSubscriber.upsert({
    where: { email: normalized },
    update: { isActive: true },
    create: { email: normalized, isActive: true },
  });
}
