import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/constants/errors";
import { slugify } from "@/lib/utils/slug";
import type { categoryUpsertSchema } from "@/lib/validations/catalog.schema";

export async function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true } },
      _count: {
        select: { products: true, children: true },
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function createCategory(
  adminUserId: string,
  input: z.infer<typeof categoryUpsertSchema>
) {
  const normalizedSlug = slugify(input.slug || input.name);
  const existing = await prisma.category.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("A category with this slug already exists.");
  }

  if (input.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
      select: { id: true },
    });
    if (!parent) {
      throw new NotFoundError("Selected parent category does not exist.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      data: {
        name: input.name,
        slug: normalizedSlug,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "CREATE_CATEGORY",
        entityType: "Category",
        entityId: created.id,
        details: `Created category ${created.name}`,
      },
    });

    return created;
  });
}

export async function updateCategory(
  adminUserId: string,
  categoryId: string,
  input: z.infer<typeof categoryUpsertSchema>
) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!existing) {
    throw new NotFoundError("Category not found.");
  }

  if (input.parentId === categoryId) {
    throw new ValidationError("A category cannot be its own parent.");
  }

  const normalizedSlug = slugify(input.slug || input.name);
  if (normalizedSlug !== existing.slug) {
    const duplicate = await prisma.category.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictError("Another category already uses this slug.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id: categoryId },
      data: {
        name: input.name,
        slug: normalizedSlug,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "UPDATE_CATEGORY",
        entityType: "Category",
        entityId: updated.id,
        details: `Updated category ${updated.name}`,
      },
    });

    return updated;
  });
}

/**
 * Safely blocks deleting categories that still own products or child categories.
 */
export async function deleteCategory(adminUserId: string, categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { products: true, children: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found.");
  }

  if (category._count.products > 0) {
    throw new ConflictError(
      `Cannot delete "${category.name}" while ${category._count.products} product(s) are assigned to it.`
    );
  }

  if (category._count.children > 0) {
    throw new ConflictError(
      `Cannot delete "${category.name}" while ${category._count.children} subcategory(ies) reference it.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.category.delete({
      where: { id: categoryId },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "DELETE_CATEGORY",
        entityType: "Category",
        entityId: deleted.id,
        details: `Deleted category ${deleted.name}`,
      },
    });

    return deleted;
  });
}
