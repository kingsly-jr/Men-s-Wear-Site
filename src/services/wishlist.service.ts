import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/constants/errors";
import { calculateDiscountPercentage } from "@/lib/utils/pricing";
import { addCartItem } from "./cart.service";

export async function getUserWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                take: 1,
              },
              variants: {
                where: { isActive: true },
                include: { size: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  if (!wishlist) return [];

  return wishlist.items
    .filter((item) => item.product.status === ProductStatus.PUBLISHED)
    .map((item) => {
      const price = Number(item.product.price);
      const originalPrice = item.product.originalPrice
        ? Number(item.product.originalPrice)
        : null;
      return {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        price,
        originalPrice,
        discountPercent: calculateDiscountPercentage(price, originalPrice),
        imageUrl: item.product.images[0]?.url ?? null,
        category: item.product.category,
        variants: item.product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          sizeName: v.size.name,
          colorName: v.color.name,
          stock: v.stock,
        })),
      };
    });
}

export async function toggleWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true },
  });

  if (!product || product.status !== ProductStatus.PUBLISHED) {
    throw new NotFoundError("Product not found.");
  }

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId,
    },
  });
  return { saved: true };
}

export async function moveWishlistItemToCart(params: {
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
}) {
  const cart = await addCartItem({
    userId: params.userId,
    variantId: params.variantId,
    quantity: params.quantity,
  });

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: params.userId },
    select: { id: true },
  });

  if (wishlist) {
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId: params.productId,
      },
    });
  }

  return cart;
}
