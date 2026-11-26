import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@/lib/constants/errors";
import {
  calculateOrderTotals,
  resolveEffectivePrice,
} from "@/lib/utils/pricing";
import { roundMoney } from "@/lib/utils/currency";
import { getStoreSettings } from "./settings.service";
import { validateCouponForSubtotal } from "./coupon.service";

export interface CartItemView {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  sizeName: string;
  colorName: string;
  colorHex: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
}

export interface CartSummaryView {
  cartId: string | null;
  itemCount: number;
  items: CartItemView[];
  appliedCoupon: {
    code: string;
    description: string | null;
  } | null;
  couponWarning: string | null;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
  currencySymbol: string;
  freeShippingThreshold: number;
}

async function resolveCartRecord(params: {
  userId?: string | null;
  guestToken?: string | null;
  createIfMissing?: boolean;
}) {
  if (params.userId) {
    const existing = await prisma.cart.findUnique({
      where: { userId: params.userId },
    });
    if (existing) return existing;
    if (params.createIfMissing) {
      return prisma.cart.create({ data: { userId: params.userId } });
    }
    return null;
  }

  if (params.guestToken) {
    const existing = await prisma.cart.findUnique({
      where: { guestToken: params.guestToken },
    });
    if (existing) return existing;
    if (params.createIfMissing) {
      return prisma.cart.create({ data: { guestToken: params.guestToken } });
    }
    return null;
  }

  return null;
}

export async function getCartSummary(params: {
  userId?: string | null;
  guestToken?: string | null;
}): Promise<CartSummaryView> {
  const settings = await getStoreSettings();
  const cart = await resolveCartRecord({
    userId: params.userId,
    guestToken: params.guestToken,
    createIfMissing: false,
  });

  if (!cart) {
    return {
      cartId: null,
      itemCount: 0,
      items: [],
      appliedCoupon: null,
      couponWarning: null,
      subtotal: 0,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      currencyCode: settings.currencyCode,
      currencySymbol: settings.currencySymbol,
      freeShippingThreshold: settings.freeShippingThreshold,
    };
  }

  const cartWithItems = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              size: true,
              color: true,
              product: {
                include: {
                  images: {
                    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cartWithItems) {
    return {
      cartId: null,
      itemCount: 0,
      items: [],
      appliedCoupon: null,
      couponWarning: null,
      subtotal: 0,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      currencyCode: settings.currencyCode,
      currencySymbol: settings.currencySymbol,
      freeShippingThreshold: settings.freeShippingThreshold,
    };
  }

  const items: CartItemView[] = cartWithItems.items
    .filter(
      (item) =>
        item.variant.isActive &&
        item.variant.product.status === ProductStatus.PUBLISHED
    )
    .map((item) => {
      const unitPrice = resolveEffectivePrice(
        Number(item.variant.product.price),
        item.variant.priceOverride ? Number(item.variant.priceOverride) : null
      );
      return {
        id: item.id,
        variantId: item.variantId,
        productId: item.variant.productId,
        productName: item.variant.product.name,
        productSlug: item.variant.product.slug,
        variantSku: item.variant.sku,
        sizeName: item.variant.size.name,
        colorName: item.variant.color.name,
        colorHex: item.variant.color.hexCode,
        imageUrl: item.variant.product.images[0]?.url ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal: roundMoney(unitPrice * item.quantity),
        availableStock: item.variant.stock,
      };
    });

  const preliminarySubtotal = roundMoney(
    items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  );

  let validatedCoupon: {
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
  } | null = null;
  let appliedCoupon: CartSummaryView["appliedCoupon"] = null;
  let couponWarning: string | null = null;

  if (cartWithItems.coupon && items.length > 0) {
    try {
      const checked = await validateCouponForSubtotal({
        code: cartWithItems.coupon.code,
        subtotal: preliminarySubtotal,
        userId: params.userId,
      });
      validatedCoupon = {
        discountType: checked.discountType,
        discountValue: checked.discountValue,
        minOrderAmount: checked.minOrderAmount,
        maxDiscountAmount: checked.maxDiscountAmount,
      };
      appliedCoupon = {
        code: checked.code,
        description: checked.description,
      };
    } catch (err) {
      couponWarning =
        err instanceof Error ? err.message : "Applied coupon is no longer valid.";
    }
  }

  const totals = calculateOrderTotals({
    items: items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    coupon: validatedCoupon,
    freeShippingThreshold: settings.freeShippingThreshold,
    defaultShippingFee: settings.defaultShippingFee,
    taxRatePercent: settings.taxRatePercent,
  });

  return {
    cartId: cartWithItems.id,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
    appliedCoupon,
    couponWarning,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    shippingAmount: totals.shippingAmount,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    currencyCode: settings.currencyCode,
    currencySymbol: settings.currencySymbol,
    freeShippingThreshold: settings.freeShippingThreshold,
  };
}

export async function addCartItem(params: {
  userId?: string | null;
  guestToken?: string | null;
  variantId: string;
  quantity: number;
}): Promise<CartSummaryView> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: params.variantId },
    include: { product: { select: { status: true } } },
  });

  if (
    !variant ||
    !variant.isActive ||
    variant.product.status !== ProductStatus.PUBLISHED
  ) {
    throw new NotFoundError("Selected product variant is unavailable.");
  }

  const cart = await resolveCartRecord({
    userId: params.userId,
    guestToken: params.guestToken,
    createIfMissing: true,
  });

  if (!cart) {
    throw new ValidationError("Unable to initialize shopping cart.");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: params.variantId,
      },
    },
  });

  const targetQuantity = (existingItem?.quantity ?? 0) + params.quantity;
  if (targetQuantity > variant.stock) {
    throw new InsufficientStockError(
      `Only ${variant.stock} unit(s) available for this variant.`
    );
  }

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: targetQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: params.variantId,
        quantity: params.quantity,
      },
    });
  }

  return getCartSummary({
    userId: params.userId,
    guestToken: params.guestToken,
  });
}

export async function updateCartItemQuantity(params: {
  userId?: string | null;
  guestToken?: string | null;
  cartItemId: string;
  quantity: number;
}): Promise<CartSummaryView> {
  const cart = await resolveCartRecord({
    userId: params.userId,
    guestToken: params.guestToken,
    createIfMissing: false,
  });

  if (!cart) {
    throw new NotFoundError("Cart not found.");
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: params.cartItemId, cartId: cart.id },
    include: { variant: true },
  });

  if (!item) {
    throw new NotFoundError("Cart item not found.");
  }

  if (params.quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    if (params.quantity > item.variant.stock) {
      throw new InsufficientStockError(
        `Only ${item.variant.stock} unit(s) available for this variant.`
      );
    }
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: params.quantity },
    });
  }

  return getCartSummary({
    userId: params.userId,
    guestToken: params.guestToken,
  });
}

export async function removeCartItem(params: {
  userId?: string | null;
  guestToken?: string | null;
  cartItemId: string;
}): Promise<CartSummaryView> {
  return updateCartItemQuantity({ ...params, quantity: 0 });
}

export async function applyCouponToCart(params: {
  userId?: string | null;
  guestToken?: string | null;
  code: string;
}): Promise<CartSummaryView> {
  const summary = await getCartSummary({
    userId: params.userId,
    guestToken: params.guestToken,
  });

  if (!summary.cartId || summary.items.length === 0) {
    throw new ValidationError("Add items to your cart before applying a coupon.");
  }

  const validated = await validateCouponForSubtotal({
    code: params.code,
    subtotal: summary.subtotal,
    userId: params.userId,
  });

  await prisma.cart.update({
    where: { id: summary.cartId },
    data: { couponId: validated.id },
  });

  return getCartSummary({
    userId: params.userId,
    guestToken: params.guestToken,
  });
}

export async function removeCouponFromCart(params: {
  userId?: string | null;
  guestToken?: string | null;
}): Promise<CartSummaryView> {
  const cart = await resolveCartRecord({
    userId: params.userId,
    guestToken: params.guestToken,
    createIfMissing: false,
  });

  if (cart) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });
  }

  return getCartSummary({
    userId: params.userId,
    guestToken: params.guestToken,
  });
}

/**
 * Merges a guest cart into an authenticated customer's database cart safely upon login/registration.
 */
export async function mergeGuestCartToUser(params: {
  guestToken?: string | null;
  userId: string;
}): Promise<void> {
  if (!params.guestToken) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken: params.guestToken },
    include: {
      items: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) {
      await prisma.cart.delete({ where: { id: guestCart.id } });
    }
    return;
  }

  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId: params.userId },
      update: {
        couponId: guestCart.couponId ?? undefined,
      },
      create: {
        userId: params.userId,
        couponId: guestCart.couponId,
      },
    });

    for (const guestItem of guestCart.items) {
      if (!guestItem.variant.isActive || guestItem.variant.stock <= 0) {
        continue;
      }

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: userCart.id,
            variantId: guestItem.variantId,
          },
        },
      });

      const mergedQty = Math.min(
        (existing?.quantity ?? 0) + guestItem.quantity,
        guestItem.variant.stock
      );

      if (mergedQty <= 0) continue;

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: mergedQty },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: guestItem.variantId,
            quantity: mergedQty,
          },
        });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}
