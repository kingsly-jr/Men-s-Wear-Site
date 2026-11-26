import {
  InventoryMovementReason,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  RequestStatus,
} from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ForbiddenError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@/lib/constants/errors";
import {
  canTransitionOrderStatus,
  isOrderEligibleForCancellation,
  isOrderEligibleForReturn,
} from "@/lib/constants/order-status";
import {
  calculateOrderTotals,
  resolveEffectivePrice,
} from "@/lib/utils/pricing";
import type {
  checkoutSchema,
  returnRequestSchema,
} from "@/lib/validations/order.schema";
import { getStoreSettings } from "./settings.service";
import { validateCouponForSubtotal } from "./coupon.service";

function generateOrderNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CT-${stamp}-${suffix}`;
}

/**
 * Executes an atomic transactional checkout:
 * - Validates cart items, active status, and variant stock
 * - Atomically decrements stock with conditional gte guard
 * - Recomputes subtotal, coupon discount, shipping, and tax server-side
 * - Creates Order, OrderShippingAddress, OrderItem snapshots, PaymentRecord (PENDING), StatusHistory, CouponUsage, and InventoryMovements
 * - Clears cart items
 */
export async function placeOrderFromCart(
  userId: string,
  input: z.infer<typeof checkoutSchema>
) {
  const settings = await getStoreSettings();

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        coupon: true,
        items: {
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

    if (!cart || cart.items.length === 0) {
      throw new ValidationError("Your shopping bag is empty.");
    }

    let resolvedAddress: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };

    if (input.addressId) {
      const saved = await tx.address.findFirst({
        where: { id: input.addressId, userId },
      });
      if (!saved) {
        throw new NotFoundError("Selected shipping address was not found.");
      }
      resolvedAddress = saved;
    } else if (input.shippingAddress) {
      resolvedAddress = input.shippingAddress;
    } else {
      throw new ValidationError("Shipping address is required.");
    }

    // Validate stock and atomically decrement per variant
    const lineSnapshots: {
      productId: string;
      variantId: string;
      productName: string;
      variantSku: string;
      sizeName: string;
      colorName: string;
      imageUrl: string | null;
      unitPrice: number;
      quantity: number;
      balanceAfter: number;
    }[] = [];

    for (const item of cart.items) {
      if (
        !item.variant.isActive ||
        item.variant.product.status !== ProductStatus.PUBLISHED
      ) {
        throw new ValidationError(
          `${item.variant.product.name} is no longer available.`
        );
      }

      const decremented = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          isActive: true,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      if (decremented.count === 0) {
        throw new InsufficientStockError(
          `Insufficient stock for ${item.variant.product.name} (${item.variant.size.name} / ${item.variant.color.name}).`
        );
      }

      const freshVariant = await tx.productVariant.findUniqueOrThrow({
        where: { id: item.variantId },
        select: { stock: true },
      });

      const unitPrice = resolveEffectivePrice(
        Number(item.variant.product.price),
        item.variant.priceOverride ? Number(item.variant.priceOverride) : null
      );

      lineSnapshots.push({
        productId: item.variant.productId,
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantSku: item.variant.sku,
        sizeName: item.variant.size.name,
        colorName: item.variant.color.name,
        imageUrl: item.variant.product.images[0]?.url ?? null,
        unitPrice,
        quantity: item.quantity,
        balanceAfter: freshVariant.stock,
      });
    }

    const preliminarySubtotal = lineSnapshots.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const couponCode = input.couponCode || cart.coupon?.code || null;
    let validatedCoupon: Awaited<ReturnType<typeof validateCouponForSubtotal>> | null =
      null;

    if (couponCode) {
      validatedCoupon = await validateCouponForSubtotal({
        code: couponCode,
        subtotal: preliminarySubtotal,
        userId,
        db: tx,
      });
    }

    const totals = calculateOrderTotals({
      items: lineSnapshots.map((i) => ({
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      coupon: validatedCoupon
        ? {
            discountType: validatedCoupon.discountType,
            discountValue: validatedCoupon.discountValue,
            minOrderAmount: validatedCoupon.minOrderAmount,
            maxDiscountAmount: validatedCoupon.maxDiscountAmount,
          }
        : null,
      freeShippingThreshold: settings.freeShippingThreshold,
      defaultShippingFee: settings.defaultShippingFee,
      taxRatePercent: settings.taxRatePercent,
    });

    const initialPaymentStatus =
      input.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
        ? PaymentStatus.PENDING
        : PaymentStatus.AWAITING_CONFIRMATION;

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: OrderStatus.PENDING,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingAmount: totals.shippingAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        internalNotes: input.notes || null,
        shippingAddress: {
          create: {
            fullName: resolvedAddress.fullName,
            phone: resolvedAddress.phone,
            line1: resolvedAddress.line1,
            line2: resolvedAddress.line2 || null,
            city: resolvedAddress.city,
            state: resolvedAddress.state,
            postalCode: resolvedAddress.postalCode,
            country: resolvedAddress.country,
          },
        },
        items: {
          create: lineSnapshots.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            productName: line.productName,
            variantSku: line.variantSku,
            sizeName: line.sizeName,
            colorName: line.colorName,
            imageUrl: line.imageUrl,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
          })),
        },
        paymentRecord: {
          create: {
            method: input.paymentMethod,
            status: initialPaymentStatus,
            amount: totals.totalAmount,
          },
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: OrderStatus.PENDING,
            note: "Order placed by customer",
            changedByUserId: userId,
          },
        },
      },
      include: {
        shippingAddress: true,
        items: true,
        paymentRecord: true,
      },
    });

    if (validatedCoupon) {
      await tx.couponUsage.create({
        data: {
          couponId: validatedCoupon.id,
          userId,
          orderId: order.id,
        },
      });
    }

    for (const line of lineSnapshots) {
      await tx.inventoryMovement.create({
        data: {
          variantId: line.variantId,
          delta: -line.quantity,
          balanceAfter: line.balanceAfter,
          reason: InventoryMovementReason.ORDER_PLACED,
          referenceId: order.id,
          actorUserId: userId,
          note: `Order ${order.orderNumber}`,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });

    return order;
  });
}

export async function listCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    include: {
      paymentRecord: true,
      items: true,
      shippingAddress: true,
    },
  });
}

export async function getCustomerOrderDetail(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      paymentRecord: true,
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      couponUsage: { include: { coupon: { select: { code: true } } } },
      cancellationRequests: { orderBy: { createdAt: "desc" } },
      returnRequests: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { orderItem: true } } },
      },
    },
  });

  if (!order) {
    throw new NotFoundError("Order not found.");
  }
  if (order.userId !== userId) {
    throw new ForbiddenError("You do not have access to this order.");
  }

  return order;
}

export async function submitCancellationRequest(params: {
  userId: string;
  orderId: string;
  reason: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { cancellationRequests: true },
  });

  if (!order) throw new NotFoundError("Order not found.");
  if (order.userId !== params.userId) {
    throw new ForbiddenError("You do not have access to this order.");
  }
  if (!isOrderEligibleForCancellation(order.status)) {
    throw new ValidationError(
      `Orders with status ${order.status} are no longer eligible for cancellation.`
    );
  }
  if (
    order.cancellationRequests.some((r) => r.status === RequestStatus.PENDING)
  ) {
    throw new ValidationError(
      "A cancellation request is already pending for this order."
    );
  }

  return prisma.cancellationRequest.create({
    data: {
      orderId: order.id,
      userId: params.userId,
      reason: params.reason,
    },
  });
}

export async function submitReturnRequest(params: {
  userId: string;
  orderId: string;
  input: z.infer<typeof returnRequestSchema>;
}) {
  const settings = await getStoreSettings();
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });

  if (!order) throw new NotFoundError("Order not found.");
  if (order.userId !== params.userId) {
    throw new ForbiddenError("You do not have access to this order.");
  }

  if (
    !isOrderEligibleForReturn({
      status: order.status,
      placedAt: order.placedAt,
      returnWindowDays: settings.returnWindowDays,
    })
  ) {
    throw new ValidationError(
      `This order is outside the ${settings.returnWindowDays}-day return window or not yet delivered.`
    );
  }

  const orderItemsById = new Map(order.items.map((item) => [item.id, item]));
  for (const requested of params.input.items) {
    const line = orderItemsById.get(requested.orderItemId);
    if (!line || requested.quantity > line.quantity) {
      throw new ValidationError("Invalid return item or quantity requested.");
    }
  }

  return prisma.returnRequest.create({
    data: {
      orderId: order.id,
      userId: params.userId,
      reason: params.input.reason,
      items: {
        create: params.input.items.map((item) => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          reasonDetail: item.reasonDetail || null,
        })),
      },
    },
    include: { items: true },
  });
}

// --- Admin Order Operations ---

export async function listAdminOrders(params?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
}) {
  return prisma.order.findMany({
    where: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.paymentStatus
        ? { paymentRecord: { status: params.paymentStatus } }
        : {}),
      ...(params?.q
        ? {
            OR: [
              { orderNumber: { contains: params.q, mode: "insensitive" } },
              { user: { email: { contains: params.q, mode: "insensitive" } } },
              { user: { name: { contains: params.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { placedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      paymentRecord: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getAdminOrderDetail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      shippingAddress: true,
      paymentRecord: true,
      items: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { name: true, email: true } } },
      },
      couponUsage: { include: { coupon: { select: { code: true } } } },
      cancellationRequests: { orderBy: { createdAt: "desc" } },
      returnRequests: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { orderItem: true } } },
      },
    },
  });

  if (!order) throw new NotFoundError("Order not found.");
  return order;
}

export async function updateAdminOrderStatus(params: {
  adminUserId: string;
  orderId: string;
  nextStatus: OrderStatus;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError("Order not found.");

    if (!canTransitionOrderStatus(order.status, params.nextStatus)) {
      throw new ValidationError(
        `Cannot transition order from ${order.status} to ${params.nextStatus}.`
      );
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: params.nextStatus },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: params.nextStatus,
        note: params.note || null,
        changedByUserId: params.adminUserId,
      },
    });

    // Restore variant stock when cancelling a non-cancelled order
    if (params.nextStatus === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
          select: { id: true, stock: true },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: item.quantity,
            balanceAfter: variant.stock,
            reason: InventoryMovementReason.ORDER_CANCELLED,
            referenceId: order.id,
            actorUserId: params.adminUserId,
            note: `Stock restored on cancellation of ${order.orderNumber}`,
          },
        });
      }
    }

    await tx.adminActivityLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: "UPDATE_ORDER_STATUS",
        entityType: "Order",
        entityId: order.id,
        details: `${order.orderNumber}: ${order.status} -> ${params.nextStatus}`,
      },
    });

    return updated;
  });
}

export async function updateAdminPaymentStatus(params: {
  adminUserId: string;
  orderId: string;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.paymentRecord.findUnique({
      where: { orderId: params.orderId },
    });
    if (!payment) throw new NotFoundError("Payment record not found.");

    const updated = await tx.paymentRecord.update({
      where: { id: payment.id },
      data: {
        status: params.status,
        reference: params.reference || payment.reference,
        notes: params.notes || payment.notes,
      },
    });

    await tx.adminActivityLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: "UPDATE_PAYMENT_STATUS",
        entityType: "PaymentRecord",
        entityId: payment.id,
        details: `Order ${params.orderId} payment -> ${params.status}`,
      },
    });

    return updated;
  });
}

export async function reviewCancellationRequest(params: {
  adminUserId: string;
  requestId: string;
  status: RequestStatus;
  adminNote?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.cancellationRequest.findUnique({
      where: { id: params.requestId },
      include: { order: { include: { items: true } } },
    });
    if (!request) throw new NotFoundError("Cancellation request not found.");

    const updated = await tx.cancellationRequest.update({
      where: { id: request.id },
      data: {
        status: params.status,
        adminNote: params.adminNote || null,
        reviewedAt: new Date(),
      },
    });

    if (
      params.status === RequestStatus.APPROVED &&
      request.order.status !== OrderStatus.CANCELLED
    ) {
      await tx.order.update({
        where: { id: request.orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: request.orderId,
          fromStatus: request.order.status,
          toStatus: OrderStatus.CANCELLED,
          note: "Cancellation request approved by admin",
          changedByUserId: params.adminUserId,
        },
      });
      for (const item of request.order.items) {
        if (!item.variantId) continue;
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
          select: { id: true, stock: true },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: item.quantity,
            balanceAfter: variant.stock,
            reason: InventoryMovementReason.ORDER_CANCELLED,
            referenceId: request.orderId,
            actorUserId: params.adminUserId,
            note: `Approved cancellation for ${request.order.orderNumber}`,
          },
        });
      }
    }

    return updated;
  });
}

export async function reviewReturnRequest(params: {
  adminUserId: string;
  requestId: string;
  status: RequestStatus;
  adminNote?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.returnRequest.findUnique({
      where: { id: params.requestId },
      include: {
        order: true,
        items: { include: { orderItem: true } },
      },
    });
    if (!request) throw new NotFoundError("Return request not found.");

    const updated = await tx.returnRequest.update({
      where: { id: request.id },
      data: {
        status: params.status,
        adminNote: params.adminNote || null,
        reviewedAt: new Date(),
      },
    });

    if (
      (params.status === RequestStatus.APPROVED ||
        params.status === RequestStatus.COMPLETED) &&
      request.order.status !== OrderStatus.RETURNED
    ) {
      await tx.order.update({
        where: { id: request.orderId },
        data: { status: OrderStatus.RETURNED },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: request.orderId,
          fromStatus: request.order.status,
          toStatus: OrderStatus.RETURNED,
          note: "Return approved by admin",
          changedByUserId: params.adminUserId,
        },
      });

      for (const retItem of request.items) {
        const variantId = retItem.orderItem.variantId;
        if (!variantId) continue;
        const variant = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: retItem.quantity } },
          select: { id: true, stock: true },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: retItem.quantity,
            balanceAfter: variant.stock,
            reason: InventoryMovementReason.RETURN_APPROVED,
            referenceId: request.orderId,
            actorUserId: params.adminUserId,
            note: `Approved return for ${request.order.orderNumber}`,
          },
        });
      }
    }

    return updated;
  });
}
