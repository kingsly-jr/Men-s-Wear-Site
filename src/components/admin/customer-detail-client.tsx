"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";

export interface AdminCustomerDetailView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  addresses: {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    placedAt: string;
  }[];
}

export function CustomerDetailClient({
  customer,
}: {
  customer: AdminCustomerDetailView;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isActive, setIsActive] = React.useState(customer.isActive);
  const [busy, setBusy] = React.useState(false);

  const toggleActive = async () => {
    setBusy(true);
    try {
      const next = !isActive;
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (res.ok) {
        setIsActive(next);
        toast({
          title: next ? "Customer activated" : "Customer deactivated",
          variant: next ? "success" : "default",
        });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
            {customer.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {customer.email} &middot; Joined{" "}
            {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Active" : "Deactivated"}
          </Badge>
          <Button
            variant={isActive ? "destructive" : "primary"}
            size="sm"
            isLoading={busy}
            onClick={toggleActive}
          >
            {isActive ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Deactivate Account</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Activate Account</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Saved Addresses ({customer.addresses.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            {customer.addresses.length === 0 ? (
              <p className="text-muted-foreground">No saved addresses.</p>
            ) : (
              customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border border-border bg-background p-3"
                >
                  <p className="font-semibold">
                    {addr.fullName} &middot; {addr.phone}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {addr.line1}, {addr.city}, {addr.state} {addr.postalCode},{" "}
                    {addr.country}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Order History ({customer.orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {customer.orders.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                No orders placed yet.
              </p>
            ) : (
              customer.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs hover:bg-background/60"
                >
                  <div>
                    <p className="font-mono font-semibold">
                      {order.orderNumber}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(order.placedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{order.status}</Badge>
                    <Badge variant="secondary">{order.paymentStatus}</Badge>
                    <span className="font-mono font-bold tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
