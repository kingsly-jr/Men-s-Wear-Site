import { OrderStatus, ProductStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAdminDashboardAnalytics(params?: {
  days?: number;
}) {
  const days = params?.days ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    revenueAggregate,
    totalOrders,
    pendingOrders,
    totalProducts,
    totalCustomers,
    lowStockVariants,
    recentOrders,
    ordersInWindow,
    topItems,
    categoryProducts,
    orderStatusGroups,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { not: OrderStatus.CANCELLED } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.product.count({ where: { status: { not: ProductStatus.ARCHIVED } } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: { stock: true, lowStockThreshold: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { placedAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        paymentRecord: { select: { status: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        placedAt: { gte: since },
        status: { not: OrderStatus.CANCELLED },
      },
      select: {
        placedAt: true,
        totalAmount: true,
      },
      orderBy: { placedAt: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { status: { not: OrderStatus.CANCELLED } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.orderItem.findMany({
      where: {
        productId: { not: null },
        order: { status: { not: OrderStatus.CANCELLED } },
      },
      select: {
        quantity: true,
        unitPrice: true,
        product: {
          select: { category: { select: { name: true } } },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const lowStockCount = lowStockVariants.filter(
    (v) => v.stock <= v.lowStockThreshold
  ).length;

  const dailyBuckets = new Map<string, { date: string; revenue: number; orders: number }>();
  for (const order of ordersInWindow) {
    const key = order.placedAt.toISOString().slice(0, 10);
    const current = dailyBuckets.get(key) ?? { date: key, revenue: 0, orders: 0 };
    current.revenue += Number(order.totalAmount);
    current.orders += 1;
    dailyBuckets.set(key, current);
  }

  const categoryTotals = new Map<string, { categoryName: string; units: number; revenue: number }>();
  for (const item of categoryProducts) {
    const catName = item.product?.category.name ?? "Uncategorized";
    const entry = categoryTotals.get(catName) ?? {
      categoryName: catName,
      units: 0,
      revenue: 0,
    };
    entry.units += item.quantity;
    entry.revenue += Number(item.unitPrice) * item.quantity;
    categoryTotals.set(catName, entry);
  }

  return {
    kpis: {
      totalRevenue: Number(revenueAggregate._sum.totalAmount ?? 0),
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCustomers,
      lowStockCount,
    },
    salesSeries: Array.from(dailyBuckets.values()),
    bestSellers: topItems.map((item) => ({
      productName: item.productName,
      unitsSold: item._sum.quantity ?? 0,
    })),
    topCategories: Array.from(categoryTotals.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    orderStatusBreakdown: orderStatusGroups.map((g) => ({
      status: g.status,
      count: g._count.id,
    })),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: order.status,
      paymentStatus: order.paymentRecord?.status ?? "PENDING",
      totalAmount: Number(order.totalAmount),
      placedAt: order.placedAt.toISOString(),
    })),
  };
}
