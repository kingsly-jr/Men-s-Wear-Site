import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { listCustomerOrders } from "@/services/order.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

export default async function AccountOrdersPage() {
  const user = await requireCustomer();
  const orders = await listCustomerOrders(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            <p>You have not placed any orders yet.</p>
            <Link
              href="/shop"
              className="mt-3 inline-block font-mono uppercase text-primary underline"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-4 bg-background p-4 sm:flex-row sm:items-center"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold">
                      {order.orderNumber}
                    </span>
                    <Badge variant="default">{order.status}</Badge>
                    <Badge variant="outline">
                      Payment: {order.paymentRecord?.status ?? "PENDING"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placed {order.placedAt.toLocaleDateString()} &middot;{" "}
                    {order.items.length} line item(s)
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center gap-1 border border-border px-3 py-2 font-mono text-xs uppercase tracking-wider hover:border-primary"
                  >
                    <span>Track</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
