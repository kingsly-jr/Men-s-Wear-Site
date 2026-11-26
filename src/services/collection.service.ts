import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/constants/errors";
import { slugify } from "@/lib/utils/slug";
import type { collectionUpsertSchema } from "@/lib/validations/catalog.schema";

export async function listActiveCollections() {
  return prisma.collection.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function listAdminCollections() {
  return prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        select: { productId: true, sortOrder: true },
      },
      _count: { select: { products: true } },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
  });
}

export async function createCollection(
  adminUserId: string,
  input: z.infer<typeof collectionUpsertSchema>
) {
  const normalizedSlug = slugify(input.slug || input.name);
  const existing = await prisma.collection.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("A collection with this slug already exists.");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.collection.create({
      data: {
        name: input.name,
        slug: normalizedSlug,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        products: input.productIds?.length
          ? {
              create: input.productIds.map((productId, idx) => ({
                productId,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "CREATE_COLLECTION",
        entityType: "Collection",
        entityId: created.id,
        details: `Created collection ${created.name}`,
      },
    });

    return created;
  });
}

export async function updateCollection(
  adminUserId: string,
  collectionId: string,
  input: z.infer<typeof collectionUpsertSchema>
) {
  const existing = await prisma.collection.findUnique({
    where: { id: collectionId },
  });
  if (!existing) {
    throw new NotFoundError("Collection not found.");
  }

  const normalizedSlug = slugify(input.slug || input.name);
  if (normalizedSlug !== existing.slug) {
    const duplicate = await prisma.collection.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictError("Another collection already uses this slug.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.collection.update({
      where: { id: collectionId },
      data: {
        name: input.name,
        slug: normalizedSlug,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    if (input.productIds !== undefined) {
      await tx.collectionProduct.deleteMany({
        where: { collectionId },
      });
      if (input.productIds.length > 0) {
        await tx.collectionProduct.createMany({
          data: input.productIds.map((productId, idx) => ({
            collectionId,
            productId,
            sortOrder: idx,
          })),
        });
      }
    }

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "UPDATE_COLLECTION",
        entityType: "Collection",
        entityId: updated.id,
        details: `Updated collection ${updated.name}`,
      },
    });

    return updated;
  });
}

export async function deleteCollection(
  adminUserId: string,
  collectionId: string
) {
  const existing = await prisma.collection.findUnique({
    where: { id: collectionId },
  });
  if (!existing) {
    throw new NotFoundError("Collection not found.");
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.collection.delete({
      where: { id: collectionId },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "DELETE_COLLECTION",
        entityType: "Collection",
        entityId: deleted.id,
        details: `Deleted collection ${deleted.name}`,
      },
    });

    return deleted;
  });
}
