import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Package } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerProfile } from "@/services/customer.service";
import { listCustomerOrders } from "@/services/order.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { ResendVerificationBanner } from "@/components/storefront/resend-verification-button";

export default async function AccountOverviewPage() {
  const user = await requireCustomer();
  const [profile, orders] = await Promise.all([
    getCustomerProfile(user.id),
    listCustomerOrders(user.id),
  ]);

  const defaultAddress =
    profile.addresses.find((a) => a.isDefault) ?? profile.addresses[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      {!profile.emailVerifiedAt ? <ResendVerificationBanner /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs">
              <Package className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Total Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {profile._count.orders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs">
              <MapPin className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Saved Addresses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {profile.addresses.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs">
              <CheckCircle2
                className="h-4 w-4 text-primary"
                strokeWidth={1.75}
              />
              <span>Account Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={profile.emailVerifiedAt ? "default" : "outline"}>
              {profile.emailVerifiedAt ? "Verified" : "Unverified"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {defaultAddress ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Default Shipping Address</CardTitle>
            <Link
              href="/account/addresses"
              className="font-mono text-[11px] uppercase text-primary hover:underline"
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">
              {defaultAddress.fullName} &middot; {defaultAddress.phone}
            </p>
            <p className="mt-1">
              {defaultAddress.line1}
              {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""},{" "}
              {defaultAddress.city}, {defaultAddress.state}{" "}
              {defaultAddress.postalCode}, {defaultAddress.country}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-primary hover:underline"
          >
            <span>All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You have not placed any orders yet.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border border border-border">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 bg-background p-3.5 text-xs transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-mono font-semibold">
                      {order.orderNumber}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {order.placedAt.toLocaleDateString()} &middot;{" "}
                      {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{order.status}</Badge>
                    <span className="font-mono font-bold tabular-nums">
                      {formatCurrency(Number(order.totalAmount))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
