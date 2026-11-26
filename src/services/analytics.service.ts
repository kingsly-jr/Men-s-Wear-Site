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
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: order.status,
      paymentStatus: order.paymentRecord?.status ?? "PENDING",
      totalAmount: Number(order.totalAmount),
      placedAt: order.placedAt,
    })),
  };
}
