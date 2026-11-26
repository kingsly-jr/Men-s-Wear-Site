"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import {
  isOrderEligibleForCancellation,
  isOrderEligibleForReturn,
} from "@/lib/constants/order-status";

export interface CustomerOrderDetailView {
  id: string;
  orderNumber: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "READY_TO_SHIP"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED";
  placedAt: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponCode: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  paymentRecord: {
    method: string;
    status: string;
    reference: string | null;
  } | null;
  items: {
    id: string;
    productName: string;
    variantSku: string;
    sizeName: string;
    colorName: string;
    unitPrice: number;
    quantity: number;
  }[];
  statusHistory: {
    id: string;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }[];
  cancellationRequests: {
    id: string;
    status: string;
    reason: string;
    adminNote: string | null;
  }[];
  returnRequests: {
    id: string;
    status: string;
    reason: string;
    adminNote: string | null;
  }[];
}

export function OrderDetailClient({
  order,
  justPlaced,
  returnWindowDays,
}: {
  order: CustomerOrderDetailView;
  justPlaced: boolean;
  returnWindowDays: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [submittingCancel, setSubmittingCancel] = React.useState(false);

  const [returnOpen, setReturnOpen] = React.useState(false);
  const [returnReason, setReturnReason] = React.useState("");
  const [selectedReturnItems, setSelectedReturnItems] = React.useState<
    Record<string, number>
  >(() => {
    const map: Record<string, number> = {};
    for (const item of order.items) map[item.id] = item.quantity;
    return map;
  });
  const [submittingReturn, setSubmittingReturn] = React.useState(false);

  const canCancel =
    isOrderEligibleForCancellation(order.status) &&
    !order.cancellationRequests.some((r) => r.status === "PENDING");

  const canReturn =
    isOrderEligibleForReturn({
      status: order.status,
      placedAt: new Date(order.placedAt),
      returnWindowDays,
    }) && !order.returnRequests.some((r) => r.status === "PENDING");

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCancel(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Request failed",
          description: data?.error?.message ?? "Could not submit cancellation.",
          variant: "error",
        });
        return;
      }
      setCancelOpen(false);
      setCancelReason("");
      toast({ title: "Cancellation request submitted", variant: "success" });
      router.refresh();
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.entries(selectedReturnItems)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

    if (items.length === 0) {
      toast({
        title: "Select at least one item",
        variant: "error",
      });
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: returnReason, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Return request failed",
          description: data?.error?.message ?? "Could not submit return.",
          variant: "error",
        });
        return;
      }
      setReturnOpen(false);
      setReturnReason("");
      toast({ title: "Return request submitted", variant: "success" });
      router.refresh();
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {justPlaced ? (
        <div className="flex items-start gap-3 border border-primary bg-primary/10 p-4 text-xs">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            strokeWidth={1.75}
          />
          <div>
            <p className="font-mono font-bold uppercase tracking-wider">
              Order {order.orderNumber} Confirmed
            </p>
            <p className="mt-1 text-muted-foreground">
              Inventory has been allocated. Payment status is currently{" "}
              <strong>{order.paymentRecord?.status ?? "PENDING"}</strong>.
            </p>
          </div>
        </div>
      ) : null}

      {/* Header & Actions */}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-base">{order.orderNumber}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Placed on {new Date(order.placedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{order.status}</Badge>
            <Badge variant="outline">
              {order.paymentRecord?.method ?? "CASH_ON_DELIVERY"} &middot;{" "}
              {order.paymentRecord?.status ?? "PENDING"}
            </Badge>
            {canCancel ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Request Cancellation</span>
              </Button>
            ) : null}
            {canReturn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Request Return</span>
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Shipping Snapshot
            </p>
            {order.shippingAddress ? (
              <div className="border border-border bg-background p-3.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {order.shippingAddress.fullName} &middot;{" "}
                  {order.shippingAddress.phone}
                </p>
                <p className="mt-1">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2
                    ? `, ${order.shippingAddress.line2}`
                    : ""}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode},{" "}
                  {order.shippingAddress.country}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Order Totals
            </p>
            <div className="flex flex-col gap-1.5 border border-border bg-background p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              {order.discountAmount > 0 ? (
                <div className="flex justify-between text-primary">
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(order.discountAmount)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(order.shippingAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(order.taxAmount)}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-2 font-bold">
                <span className="font-mono uppercase">Total</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Ordered Garments ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border border border-border p-0">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 bg-background p-4 text-xs"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {item.productName}
                </p>
                <p className="mt-0.5 font-mono text-[11px] uppercase text-muted-foreground">
                  {item.sizeName} / {item.colorName} &middot; SKU:{" "}
                  {item.variantSku}
                </p>
              </div>
              <div className="flex items-center gap-6 font-mono tabular-nums">
                <span>
                  {formatCurrency(item.unitPrice)} &times; {item.quantity}
                </span>
                <span className="font-bold">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Timeline & Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Order Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {order.statusHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between border-l-2 border-primary bg-background px-4 py-2.5 text-xs"
            >
              <div>
                <p className="font-mono font-semibold uppercase">
                  {entry.toStatus}
                </p>
                {entry.note ? (
                  <p className="mt-0.5 text-muted-foreground">{entry.note}</p>
                ) : null}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
          ))}

          {order.cancellationRequests.map((req) => (
            <div
              key={req.id}
              className="border border-border bg-background p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase">
                  Cancellation Request
                </span>
                <Badge variant="outline">{req.status}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{req.reason}</p>
              {req.adminNote ? (
                <p className="mt-1 text-primary">Admin: {req.adminNote}</p>
              ) : null}
            </div>
          ))}

          {order.returnRequests.map((req) => (
            <div
              key={req.id}
              className="border border-border bg-background p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase">Return Request</span>
                <Badge variant="outline">{req.status}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{req.reason}</p>
              {req.adminNote ? (
                <p className="mt-1 text-primary">Admin: {req.adminNote}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cancellation Modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Request Order Cancellation"
      >
        <form onSubmit={handleCancelSubmit} className="flex flex-col gap-4">
          <Textarea
            required
            placeholder="Reason for cancellation (minimum 10 characters)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <Button
            type="submit"
            variant="destructive"
            isLoading={submittingCancel}
          >
            Submit Cancellation Request
          </Button>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Request Item Return"
      >
        <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border border-border bg-background p-2.5 text-xs"
              >
                <span>
                  {item.productName} ({item.sizeName})
                </span>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={selectedReturnItems[item.id] ?? 0}
                  onChange={(e) =>
                    setSelectedReturnItems((prev) => ({
                      ...prev,
                      [item.id]: Math.max(
                        0,
                        Math.min(item.quantity, Number(e.target.value))
                      ),
                    }))
                  }
                  className="h-8 w-16 border border-border bg-input px-2 font-mono text-xs"
                />
              </div>
            ))}
          </div>
          <Textarea
            required
            placeholder="Reason for return (minimum 10 characters)..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <Button type="submit" isLoading={submittingReturn}>
            Submit Return Request
          </Button>
        </form>
      </Modal>
    </div>
  );
}
