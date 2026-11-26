"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

export interface AnalyticsDashboardData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalCustomers: number;
    lowStockCount: number;
  };
  salesSeries: { date: string; revenue: number; orders: number }[];
  bestSellers: { productName: string; unitsSold: number }[];
  topCategories: { categoryName: string; units: number; revenue: number }[];
  orderStatusBreakdown: { status: string; count: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    placedAt: string;
  }[];
}

export function AnalyticsDashboard({
  initialData,
}: {
  initialData: AnalyticsDashboardData;
}) {
  const [days, setDays] = React.useState(30);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);

  const handleRangeChange = async (nextDays: number) => {
    setDays(nextDays);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${nextDays}`);
      if (res.ok) {
        const json = (await res.json()) as AnalyticsDashboardData;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(data.kpis.totalRevenue),
      icon: DollarSign,
      href: "/admin/orders",
    },
    {
      label: "Total Orders",
      value: String(data.kpis.totalOrders),
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Pending Orders",
      value: String(data.kpis.pendingOrders),
      icon: Clock,
      href: "/admin/orders",
    },
    {
      label: "Active Products",
      value: String(data.kpis.totalProducts),
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Customers",
      value: String(data.kpis.totalCustomers),
      icon: Users,
      href: "/admin/customers",
    },
    {
      label: "Low Stock Variants",
      value: String(data.kpis.lowStockCount),
      icon: AlertTriangle,
      href: "/admin/inventory?filter=low_stock",
    },
  ];

  const maxRevenue = Math.max(
    1,
    ...data.salesSeries.map((point) => point.revenue)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
            Executive Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Live metrics aggregated directly from PostgreSQL orders, catalog,
            and inventory.
          </p>
        </div>

        <div className="flex gap-1.5">
          {[
            { label: "7D", value: 7 },
            { label: "30D", value: 30 },
            { label: "90D", value: 90 },
            { label: "1Y", value: 365 },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleRangeChange(opt.value)}
              className={cn(
                "border px-3 py-1.5 font-mono text-xs uppercase cursor-pointer",
                days === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            >
              <Link href={kpi.href}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {kpi.label}
                      </span>
                      <Icon
                        className="h-4 w-4 text-primary"
                        strokeWidth={1.75}
                      />
                    </div>
                    <p className="mt-3 font-mono text-xl font-bold tabular-nums">
                      {kpi.value}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Sales Series & Top Performers */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Revenue &amp; Daily Sales ({days} Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : data.salesSeries.length === 0 ? (
              <div className="flex h-56 items-center justify-center border border-border bg-background text-xs text-muted-foreground">
                No completed order revenue recorded in the selected {days}-day
                window yet.
              </div>
            ) : (
              <div className="flex h-56 items-end gap-2 border border-border bg-background p-4">
                {data.salesSeries.map((point) => {
                  const heightPct = Math.max(
                    6,
                    Math.round((point.revenue / maxRevenue) * 100)
                  );
                  return (
                    <div
                      key={point.date}
                      className="group flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <div
                        title={`${point.date}: ${formatCurrency(point.revenue)} (${point.orders} orders)`}
                        className="w-full bg-primary transition-colors group-hover:bg-accent"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {point.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Categories &amp; Best Sellers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-xs">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Best-Selling Products
              </p>
              {data.bestSellers.length === 0 ? (
                <p className="text-muted-foreground">No order sales yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.bestSellers.map((item) => (
                    <div
                      key={item.productName}
                      className="flex justify-between border-b border-border pb-1.5"
                    >
                      <span className="truncate pr-2">{item.productName}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {item.unitsSold} sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Top Categories
              </p>
              {data.topCategories.length === 0 ? (
                <p className="text-muted-foreground">No category sales yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.topCategories.map((cat) => (
                    <div
                      key={cat.categoryName}
                      className="flex justify-between border-b border-border pb-1.5"
                    >
                      <span>{cat.categoryName}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatCurrency(cat.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="font-mono text-xs uppercase text-primary hover:underline"
          >
            Manage All Orders
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No customer orders have been placed yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-mono uppercase text-muted-foreground">
                    <th className="py-2.5 pr-4">Order</th>
                    <th className="py-2.5 pr-4">Customer</th>
                    <th className="py-2.5 pr-4">Order Status</th>
                    <th className="py-2.5 pr-4">Payment</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 pr-4 font-mono font-semibold">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:text-primary"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{order.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{order.status}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{order.paymentStatus}</Badge>
                      </td>
                      <td className="py-3 text-right font-mono font-bold tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
