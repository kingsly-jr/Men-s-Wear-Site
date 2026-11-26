import { afterAll, describe, expect, test } from "bun:test";
import {
  InventoryMovementReason,
  OrderStatus,
  PaymentMethod,
  UserRole,
} from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import {
  ConflictError,
  InsufficientStockError,
} from "../../src/lib/constants/errors";
import { deleteCategory } from "../../src/services/category.service";
import {
  addCartItem,
  getCartSummary,
  mergeGuestCartToUser,
} from "../../src/services/cart.service";
import {
  placeOrderFromCart,
  updateAdminOrderStatus,
} from "../../src/services/order.service";
import { adjustVariantStock } from "../../src/services/inventory.service";

const createdUserIds: string[] = [];
const createdOrderIds: string[] = [];

afterAll(async () => {
  for (const orderId of createdOrderIds) {
    await prisma.inventoryMovement.deleteMany({
      where: { referenceId: orderId },
    });
    await prisma.order.deleteMany({ where: { id: orderId } });
  }
  for (const userId of createdUserIds) {
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

describe("Database Integration: Auth, Inventory, Cart & Transactional Orders", () => {
  test("password hashing verifies securely with scrypt", async () => {
    const hash = await hashPassword("CrimsonSecret#2026");
    expect(await verifyPassword("CrimsonSecret#2026", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  test("blocks deleting a category still referenced by products", async () => {
    const category = await prisma.category.findFirstOrThrow({
      where: { products: { some: {} } },
    });
    const admin = await prisma.user.findFirstOrThrow({
      where: { role: UserRole.ADMIN },
    });

    await expect(deleteCategory(admin.id, category.id)).rejects.toBeInstanceOf(
      ConflictError
    );
  });

  test("executes guest cart merge, transactional checkout, stock decrement, oversell prevention, and cancellation restock", async () => {
    const admin = await prisma.user.findFirstOrThrow({
      where: { role: UserRole.ADMIN },
    });
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { isActive: true, stock: { gte: 3 } },
      orderBy: { stock: "desc" },
    });

    const initialStock = variant.stock;

    const testCustomer = await prisma.user.create({
      data: {
        email: `integration-${Date.now()}@crimsonterminal.store`,
        name: "Integration Patron",
        passwordHash: await hashPassword("PatronPass123!"),
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
    createdUserIds.push(testCustomer.id);

    const guestToken = `guest-int-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 1. Add to guest cart & merge into customer cart
    await addCartItem({
      guestToken,
      variantId: variant.id,
      quantity: 2,
    });

    await mergeGuestCartToUser({
      guestToken,
      userId: testCustomer.id,
    });

    const mergedCart = await getCartSummary({ userId: testCustomer.id });
    expect(mergedCart.itemCount).toBe(2);

    // 2. Oversell guard: trying to add beyond stock fails
    await expect(
      addCartItem({
        userId: testCustomer.id,
        variantId: variant.id,
        quantity: initialStock + 50,
      })
    ).rejects.toBeInstanceOf(InsufficientStockError);

    // 3. Place transactional order
    const order = await placeOrderFromCart(testCustomer.id, {
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      shippingAddress: {
        fullName: "Integration Patron",
        phone: "9876543210",
        line1: "100 Terminal Avenue",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
    });
    createdOrderIds.push(order.id);

    const afterOrderVariant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(afterOrderVariant.stock).toBe(initialStock - 2);

    // Cart should be cleared after checkout
    const postCheckoutCart = await getCartSummary({ userId: testCustomer.id });
    expect(postCheckoutCart.itemCount).toBe(0);

    // 4. Cancel order as admin and confirm stock is restored transactionally
    await updateAdminOrderStatus({
      adminUserId: admin.id,
      orderId: order.id,
      nextStatus: OrderStatus.CANCELLED,
      note: "Integration test cleanup cancellation",
    });

    const restoredVariant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(restoredVariant.stock).toBe(initialStock);

    // 5. Inventory adjustment prevents negative stock
    await expect(
      adjustVariantStock({
        adminUserId: admin.id,
        variantId: variant.id,
        delta: -(initialStock + 100),
        reason: InventoryMovementReason.ADJUSTMENT,
        note: "Negative check",
      })
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });
});
