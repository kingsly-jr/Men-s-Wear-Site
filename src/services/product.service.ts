import {
  InventoryMovementReason,
  Prisma,
  ProductStatus,
} from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/constants/errors";
import { calculateDiscountPercentage } from "@/lib/utils/pricing";
import { slugify } from "@/lib/utils/slug";
import type {
  catalogFilterSchema,
  productReviewSchema,
  productUpsertSchema,
} from "@/lib/validations/catalog.schema";

export interface CatalogProductCardDTO {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  primaryImageUrl: string | null;
  secondaryImageUrl: string | null;
  colors: { id: string; name: string; hexCode: string }[];
  sizes: { id: string; name: string; code: string }[];
  totalStock: number;
  inStock: boolean;
}

function mapProductCard(
  product: Prisma.ProductGetPayload<{
    include: {
      category: { select: { id: true; name: true; slug: true } };
      images: true;
      variants: {
        where: { isActive: true };
        include: { size: true; color: true };
      };
    };
  }>
): CatalogProductCardDTO {
  const sortedImages = [...product.images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  const colorMap = new Map<string, { id: string; name: string; hexCode: string }>();
  const sizeMap = new Map<string, { id: string; name: string; code: string; sortOrder: number }>();
  let totalStock = 0;

  for (const variant of product.variants) {
    totalStock += variant.stock;
    colorMap.set(variant.color.id, {
      id: variant.color.id,
      name: variant.color.name,
      hexCode: variant.color.hexCode,
    });
    sizeMap.set(variant.size.id, {
      id: variant.size.id,
      name: variant.size.name,
      code: variant.size.code,
      sortOrder: variant.size.sortOrder,
    });
  }

  const price = Number(product.price);
  const originalPrice = product.originalPrice
    ? Number(product.originalPrice)
    : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price,
    originalPrice,
    discountPercent: calculateDiscountPercentage(price, originalPrice),
    isFeatured: product.isFeatured,
    category: product.category,
    primaryImageUrl: sortedImages[0]?.url ?? null,
    secondaryImageUrl: sortedImages[1]?.url ?? sortedImages[0]?.url ?? null,
    colors: Array.from(colorMap.values()),
    sizes: Array.from(sizeMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ id, name, code }) => ({ id, name, code })),
    totalStock,
    inStock: totalStock > 0,
  };
}

export async function listCatalogProducts(
  filters: z.infer<typeof catalogFilterSchema>
) {
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.PUBLISHED,
  };

  if (filters.category) {
    const category = await prisma.category.findUnique({
      where: { slug: filters.category },
      include: { children: { select: { id: true } } },
    });
    if (category) {
      const categoryIds = [
        category.id,
        ...category.children.map((child) => child.id),
      ];
      where.categoryId = { in: categoryIds };
    } else {
      return { items: [], total: 0, page: filters.page, pageSize: filters.pageSize, totalPages: 0 };
    }
  }

  if (filters.collection) {
    where.collections = {
      some: {
        collection: { slug: filters.collection, isActive: true },
      },
    };
  }

  if (filters.q) {
    const query = filters.q.trim();
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { fabric: { contains: query, mode: "insensitive" } },
      { category: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    };
  }

  if (filters.size || filters.color || filters.inStock) {
    where.variants = {
      some: {
        isActive: true,
        ...(filters.size
          ? { size: { code: { equals: filters.size, mode: "insensitive" } } }
          : {}),
        ...(filters.color
          ? { color: { name: { equals: filters.color, mode: "insensitive" } } }
          : {}),
        ...(filters.inStock ? { stock: { gt: 0 } } : {}),
      },
    };
  }

  if (filters.discounted) {
    where.originalPrice = { not: null };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    filters.sort === "newest"
      ? [{ createdAt: "desc" }]
      : filters.sort === "price_asc"
      ? [{ price: "asc" }]
      : filters.sort === "price_desc"
      ? [{ price: "desc" }]
      : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const allMatching = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: {
        where: { isActive: true },
        include: { size: true, color: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
  });

  let mapped = allMatching.map((p) => ({
    card: mapProductCard(p),
    orderCount: p._count.orderItems,
  }));

  if (filters.discounted) {
    mapped = mapped.filter((entry) => entry.card.discountPercent > 0);
  }

  if (filters.sort === "best_selling") {
    mapped.sort((a, b) => b.orderCount - a.orderCount);
  } else if (filters.sort === "highest_discount") {
    mapped.sort((a, b) => b.card.discountPercent - a.card.discountPercent);
  }

  const total = mapped.length;
  const totalPages = Math.ceil(total / filters.pageSize);
  const start = (filters.page - 1) * filters.pageSize;
  const items = mapped.slice(start, start + filters.pageSize).map((m) => m.card);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        include: {
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      specifications: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { isActive: true },
        include: { size: true, color: true },
        orderBy: [{ size: { sortOrder: "asc" } }, { color: { name: "asc" } }],
      },
      collections: {
        include: { collection: { select: { id: true, name: true, slug: true } } },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product || product.status !== ProductStatus.PUBLISHED) {
    return null;
  }

  const relatedRaw = await prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: {
        where: { isActive: true },
        include: { size: true, color: true },
      },
    },
  });

  return {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    discountPercent: calculateDiscountPercentage(
      Number(product.price),
      product.originalPrice ? Number(product.originalPrice) : null
    ),
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
    relatedProducts: relatedRaw.map(mapProductCard),
  };
}

export async function getSearchSuggestions(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { products: [], categories: [] };
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { sku: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: trimmed, mode: "insensitive" },
      },
      take: 4,
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      imageUrl: p.images[0]?.url ?? null,
    })),
    categories,
  };
}

export async function getBestSellingProducts(limit = 8) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { status: { not: "CANCELLED" } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const ids = grouped
    .map((g) => g.productId)
    .filter((id): id is string => Boolean(id));

  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.PUBLISHED,
      ...(ids.length > 0 ? { id: { in: ids } } : {}),
    },
    take: limit,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: {
        where: { isActive: true },
        include: { size: true, color: true },
      },
    },
  });

  return products.map(mapProductCard);
}

export async function recordRecentlyViewed(userId: string, productId: string) {
  await prisma.recentlyViewedProduct.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    update: { viewedAt: new Date() },
    create: { userId, productId },
  });
}

export async function getRecentlyViewedProducts(userId: string, limit = 6) {
  const entries = await prisma.recentlyViewedProduct.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: true,
          variants: {
            where: { isActive: true },
            include: { size: true, color: true },
          },
        },
      },
    },
  });

  return entries
    .filter((e) => e.product.status === ProductStatus.PUBLISHED)
    .map((e) => mapProductCard(e.product));
}

export async function submitProductReview(
  userId: string,
  input: z.infer<typeof productReviewSchema>
) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true },
  });
  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  const deliveredOrderCount = await prisma.orderItem.count({
    where: {
      productId: input.productId,
      order: {
        userId,
        status: "DELIVERED",
      },
    },
  });

  return prisma.productReview.upsert({
    where: {
      productId_userId: {
        productId: input.productId,
        userId,
      },
    },
    update: {
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      isVerifiedPurchase: deliveredOrderCount > 0,
    },
    create: {
      productId: input.productId,
      userId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      isVerifiedPurchase: deliveredOrderCount > 0,
      isApproved: true,
    },
  });
}

export async function listFilterOptions() {
  const [sizes, colors] = await Promise.all([
    prisma.sizeOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.colorOption.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { sizes, colors };
}

// --- Admin Catalog Operations ---

export async function listAdminProducts(params?: {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
}) {
  const where: Prisma.ProductWhereInput = {};
  if (params?.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { sku: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params?.status) where.status = params.status;
  if (params?.categoryId) where.categoryId = params.categoryId;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
      },
      variants: {
        select: { id: true, stock: true, lowStockThreshold: true, isActive: true },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    status: p.status,
    isFeatured: p.isFeatured,
    category: p.category,
    imageUrl: p.images[0]?.url ?? null,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    createdAt: p.createdAt,
  }));
}

export async function createAdminProduct(
  adminUserId: string,
  input: z.infer<typeof productUpsertSchema>
) {
  const normalizedSlug = slugify(input.slug || input.name);
  const existing = await prisma.product.findFirst({
    where: {
      OR: [{ slug: normalizedSlug }, { sku: input.sku }],
    },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("A product with this slug or SKU already exists.");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: input.name,
        slug: normalizedSlug,
        sku: input.sku,
        description: input.description,
        fabric: input.fabric || null,
        material: input.material || null,
        careInstructions: input.careInstructions || null,
        price: input.price,
        originalPrice: input.originalPrice ?? null,
        status: input.status,
        isFeatured: input.isFeatured,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        categoryId: input.categoryId,
        specifications: {
          create: input.specifications.map((s, idx) => ({
            specKey: s.specKey,
            specValue: s.specValue,
            sortOrder: s.sortOrder ?? idx,
          })),
        },
        images: {
          create: input.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText || null,
            sortOrder: img.sortOrder ?? idx,
            isPrimary: img.isPrimary || idx === 0,
          })),
        },
        variants: {
          create: input.variants.map((v) => ({
            sizeId: v.sizeId,
            colorId: v.colorId,
            sku: v.sku,
            priceOverride: v.priceOverride ?? null,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
            isActive: v.isActive,
          })),
        },
        collections: input.collectionIds.length
          ? {
              create: input.collectionIds.map((collectionId, idx) => ({
                collectionId,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });

    for (const variant of created.variants) {
      if (variant.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: variant.stock,
            balanceAfter: variant.stock,
            reason: InventoryMovementReason.RESTOCK,
            actorUserId: adminUserId,
            note: "Initial product creation stock",
          },
        });
      }
    }

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "CREATE_PRODUCT",
        entityType: "Product",
        entityId: created.id,
        details: `Created product ${created.name} (${created.sku})`,
      },
    });

    return created;
  });
}

export async function updateAdminProduct(
  adminUserId: string,
  productId: string,
  input: z.infer<typeof productUpsertSchema>
) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!existing) {
    throw new NotFoundError("Product not found.");
  }

  const normalizedSlug = slugify(input.slug || input.name);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        slug: normalizedSlug,
        sku: input.sku,
        description: input.description,
        fabric: input.fabric || null,
        material: input.material || null,
        careInstructions: input.careInstructions || null,
        price: input.price,
        originalPrice: input.originalPrice ?? null,
        status: input.status,
        isFeatured: input.isFeatured,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        categoryId: input.categoryId,
      },
    });

    await tx.productSpecification.deleteMany({ where: { productId } });
    if (input.specifications.length > 0) {
      await tx.productSpecification.createMany({
        data: input.specifications.map((s, idx) => ({
          productId,
          specKey: s.specKey,
          specValue: s.specValue,
          sortOrder: s.sortOrder ?? idx,
        })),
      });
    }

    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productImage.createMany({
      data: input.images.map((img, idx) => ({
        productId,
        url: img.url,
        altText: img.altText || null,
        sortOrder: img.sortOrder ?? idx,
        isPrimary: img.isPrimary || idx === 0,
      })),
    });

    await tx.collectionProduct.deleteMany({ where: { productId } });
    if (input.collectionIds.length > 0) {
      await tx.collectionProduct.createMany({
        data: input.collectionIds.map((collectionId, idx) => ({
          productId,
          collectionId,
          sortOrder: idx,
        })),
      });
    }

    // Upsert variants carefully to preserve order/cart references
    const existingById = new Map(existing.variants.map((v) => [v.id, v]));
    const incomingIds = new Set(
      input.variants.map((v) => v.id).filter((id): id is string => Boolean(id))
    );

    for (const oldVariant of existing.variants) {
      if (!incomingIds.has(oldVariant.id)) {
        await tx.productVariant.update({
          where: { id: oldVariant.id },
          data: { isActive: false },
        });
      }
    }

    for (const variantInput of input.variants) {
      if (variantInput.id && existingById.has(variantInput.id)) {
        const previous = existingById.get(variantInput.id)!;
        const delta = variantInput.stock - previous.stock;
        await tx.productVariant.update({
          where: { id: variantInput.id },
          data: {
            sizeId: variantInput.sizeId,
            colorId: variantInput.colorId,
            sku: variantInput.sku,
            priceOverride: variantInput.priceOverride ?? null,
            stock: variantInput.stock,
            lowStockThreshold: variantInput.lowStockThreshold,
            isActive: variantInput.isActive,
          },
        });
        if (delta !== 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variantInput.id,
              delta,
              balanceAfter: variantInput.stock,
              reason: InventoryMovementReason.ADJUSTMENT,
              actorUserId: adminUserId,
              note: "Stock updated via product editor",
            },
          });
        }
      } else {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId,
            sizeId: variantInput.sizeId,
            colorId: variantInput.colorId,
            sku: variantInput.sku,
            priceOverride: variantInput.priceOverride ?? null,
            stock: variantInput.stock,
            lowStockThreshold: variantInput.lowStockThreshold,
            isActive: variantInput.isActive,
          },
        });
        if (createdVariant.stock > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: createdVariant.id,
              delta: createdVariant.stock,
              balanceAfter: createdVariant.stock,
              reason: InventoryMovementReason.RESTOCK,
              actorUserId: adminUserId,
              note: "New variant created via product editor",
            },
          });
        }
      }
    }

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "UPDATE_PRODUCT",
        entityType: "Product",
        entityId: productId,
        details: `Updated product ${updated.name}`,
      },
    });

    return updated;
  });
}

export async function bulkUpdateProductStatus(
  adminUserId: string,
  productIds: string[],
  status: ProductStatus
) {
  if (productIds.length === 0) {
    throw new ValidationError("Select at least one product.");
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.product.updateMany({
      where: { id: { in: productIds } },
      data: { status },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "BULK_UPDATE_PRODUCT_STATUS",
        entityType: "Product",
        details: `Updated ${result.count} product(s) to ${status}`,
      },
    });

    return result;
  });
}

export async function deleteOrArchiveProduct(
  adminUserId: string,
  productId: string
) {
  const orderRefs = await prisma.orderItem.count({
    where: { productId },
  });

  return prisma.$transaction(async (tx) => {
    if (orderRefs > 0) {
      const archived = await tx.product.update({
        where: { id: productId },
        data: { status: ProductStatus.ARCHIVED },
      });
      await tx.adminActivityLog.create({
        data: {
          adminUserId,
          action: "ARCHIVE_PRODUCT",
          entityType: "Product",
          entityId: productId,
          details: `Archived product ${archived.name} (referenced by orders)`,
        },
      });
      return { archived: true };
    }

    const deleted = await tx.product.delete({ where: { id: productId } });
    await tx.adminActivityLog.create({
      data: {
        adminUserId,
        action: "DELETE_PRODUCT",
        entityType: "Product",
        entityId: productId,
        details: `Deleted product ${deleted.name}`,
      },
    });
    return { archived: false };
  });
}

export async function getAdminProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: { size: true, color: true },
        orderBy: [{ size: { sortOrder: "asc" } }, { color: { name: "asc" } }],
      },
      collections: { select: { collectionId: true } },
    },
  });

  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  return {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    collectionIds: product.collections.map((c) => c.collectionId),
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
  };
}
