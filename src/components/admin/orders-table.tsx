"use client";

import * as React from "react";
import Link from "next/link";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Eye, Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/currency";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  itemCount: number;
  totalAmount: number;
  placedAt: string;
}

export function OrdersTable({
  initialOrders,
}: {
  initialOrders: AdminOrderRow[];
}) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [paymentFilter, setPaymentFilter] = React.useState("ALL");

  const filtered = React.useMemo(() => {
    return initialOrders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (paymentFilter !== "ALL" && order.paymentStatus !== paymentFilter)
        return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerEmail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialOrders, search, statusFilter, paymentFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Orders ({initialOrders.length})
        </h1>
        <p className="text-xs text-muted-foreground">
          Monitor order fulfillment, payment verification, and customer
          cancellation/return requests.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, name, or email..."
            className="pl-9"
          />
        </div>

        <div className="w-44">
          <Select
            aria-label="Filter by order status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Order Statuses</option>
            {Object.values(OrderStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-48">
          <Select
            aria-label="Filter by payment status"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="ALL">All Payment Statuses</option>
            {Object.values(PaymentStatus).map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart
              className="h-4 w-4 text-primary"
              strokeWidth={1.75}
            />
            <span>Order Ledger ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted font-mono uppercase text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-background/60">
                    <td className="px-4 py-3 font-mono font-semibold">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:text-primary"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-[11px] font-normal text-muted-foreground">
                        {order.itemCount} item(s)
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {new Date(order.placedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{order.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{order.paymentStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        aria-label={`Inspect order ${order.orderNumber}`}
                        className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-primary"
                      >
                        <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
