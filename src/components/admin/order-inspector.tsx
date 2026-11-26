"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderStatus, PaymentStatus, RequestStatus } from "@prisma/client";
import { Check, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/constants/order-status";
import { formatCurrency } from "@/lib/utils/currency";

export interface AdminOrderDetailView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  internalNotes: string | null;
  couponCode: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
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
    status: PaymentStatus;
    reference: string | null;
    notes: string | null;
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
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
    changedByName: string | null;
  }[];
  cancellationRequests: {
    id: string;
    status: RequestStatus;
    reason: string;
    adminNote: string | null;
    createdAt: string;
  }[];
  returnRequests: {
    id: string;
    status: RequestStatus;
    reason: string;
    adminNote: string | null;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      productName: string;
      variantSku: string;
    }[];
  }[];
}

export function OrderInspector({
  order,
}: {
  order: AdminOrderDetailView;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const allowedNext = ORDER_STATUS_TRANSITIONS[order.status];
  const [nextStatus, setNextStatus] = React.useState<OrderStatus | "">(
    allowedNext[0] ?? ""
  );
  const [statusNote, setStatusNote] = React.useState("");

  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>(
    order.paymentRecord?.status ?? PaymentStatus.PENDING
  );
  const [paymentReference, setPaymentReference] = React.useState(
    order.paymentRecord?.reference ?? ""
  );
  const [internalNotes, setInternalNotes] = React.useState(
    order.internalNotes ?? ""
  );
  const [busy, setBusy] = React.useState(false);

  const runOrderPatch = async (payload: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Update failed",
          description: data?.error?.message ?? "Operation rejected.",
          variant: "error",
        });
        return;
      }
      toast({ title: msg, variant: "success" });
      setStatusNote("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const reviewRequest = async (
    kind: "cancellations" | "returns",
    requestId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${kind}/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNote:
            status === "APPROVED"
              ? "Approved by administrator."
              : "Rejected by administrator.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Review failed",
          description: data?.error?.message ?? "Could not review request.",
          variant: "error",
        });
        return;
      }
      toast({ title: `Request ${status.toLowerCase()}`, variant: "success" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
            {order.orderNumber}
          </h1>
          <p className="text-xs text-muted-foreground">
            Placed {new Date(order.placedAt).toLocaleString()} by{" "}
            <Link
              href={`/admin/customers/${order.customer.id}`}
              className="text-primary hover:underline"
            >
              {order.customer.name} ({order.customer.email})
            </Link>
          </p>
        </div>

        <div className="flex gap-2">
          <Badge variant="default">{order.status}</Badge>
          <Badge variant="outline">
            Payment: {order.paymentRecord?.status ?? "PENDING"}
          </Badge>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Progression */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Progression</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {allowedNext.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Order is in terminal state ({order.status}).
              </p>
            ) : (
              <>
                <div>
                  <Label htmlFor="ord-next">Transition To</Label>
                  <Select
                    id="ord-next"
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(e.target.value as OrderStatus)
                    }
                    className="mt-1"
                  >
                    {allowedNext.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ord-note">History Note</Label>
                  <Input
                    id="ord-note"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Tracking # or fulfillment note..."
                    className="mt-1"
                  />
                </div>
                <Button
                  isLoading={busy}
                  disabled={!nextStatus}
                  onClick={() =>
                    runOrderPatch(
                      { action: "status", status: nextStatus, note: statusNote },
                      `Order transitioned to ${nextStatus}`
                    )
                  }
                >
                  Update Order Status
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Method: {order.paymentRecord?.method ?? "CASH_ON_DELIVERY"}
            </p>
            <div>
              <Label htmlFor="pay-status">Payment Status</Label>
              <Select
                id="pay-status"
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as PaymentStatus)
                }
                className="mt-1"
              >
                {Object.values(PaymentStatus).map((ps) => (
                  <option key={ps} value={ps}>
                    {ps}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pay-ref">Transaction / Receipt Reference</Label>
              <Input
                id="pay-ref"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="UTR / Cash receipt ID"
                className="mt-1"
              />
            </div>
            <Button
              variant="secondary"
              isLoading={busy}
              onClick={() =>
                runOrderPatch(
                  {
                    action: "payment",
                    status: paymentStatus,
                    reference: paymentReference,
                  },
                  "Payment record updated"
                )
              }
            >
              Save Payment Status
            </Button>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Internal Admin Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Private fulfillment or dispatch notes..."
              className="min-h-28"
            />
            <Button
              variant="outline"
              isLoading={busy}
              onClick={() =>
                runOrderPatch(
                  { action: "notes", internalNotes },
                  "Internal notes saved"
                )
              }
            >
              <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Save Notes</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items & Shipping */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Line Items ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 text-xs"
              >
                <div>
                  <p className="font-semibold">{item.productName}</p>
                  <p className="font-mono text-[11px] uppercase text-muted-foreground">
                    {item.sizeName} / {item.colorName} &middot; SKU:{" "}
                    {item.variantSku}
                  </p>
                </div>
                <div className="font-mono tabular-nums">
                  {formatCurrency(item.unitPrice)} &times; {item.quantity} ={" "}
                  <strong>
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </strong>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Totals &amp; Destination</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5 border-b border-border pb-3">
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
              <div className="mt-1 flex justify-between font-bold">
                <span className="font-mono uppercase">Total</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            {order.shippingAddress ? (
              <div className="text-muted-foreground">
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
          </CardContent>
        </Card>
      </div>

      {/* Cancellation & Return Requests + History */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cancellation &amp; Return Requests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            {order.cancellationRequests.length === 0 &&
            order.returnRequests.length === 0 ? (
              <p className="text-muted-foreground">
                No cancellation or return requests on this order.
              </p>
            ) : null}

            {order.cancellationRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold uppercase">
                    Cancellation Request
                  </span>
                  <Badge variant="outline">{req.status}</Badge>
                </div>
                <p className="text-muted-foreground">{req.reason}</p>
                {req.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      isLoading={busy}
                      onClick={() =>
                        reviewRequest("cancellations", req.id, "APPROVED")
                      }
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Approve &amp; Restore Stock</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={busy}
                      onClick={() =>
                        reviewRequest("cancellations", req.id, "REJECTED")
                      }
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Reject</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            {order.returnRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold uppercase">
                    Return Request
                  </span>
                  <Badge variant="outline">{req.status}</Badge>
                </div>
                <p className="text-muted-foreground">{req.reason}</p>
                <ul className="list-disc pl-4 text-[11px] text-muted-foreground">
                  {req.items.map((ri) => (
                    <li key={ri.id}>
                      {ri.productName} ({ri.variantSku}) &times; {ri.quantity}
                    </li>
                  ))}
                </ul>
                {req.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      isLoading={busy}
                      onClick={() =>
                        reviewRequest("returns", req.id, "APPROVED")
                      }
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Approve &amp; Restock</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={busy}
                      onClick={() =>
                        reviewRequest("returns", req.id, "REJECTED")
                      }
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Reject</span>
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Audit History</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-xs">
            {order.statusHistory.map((h) => (
              <div
                key={h.id}
                className="flex items-start justify-between border-l-2 border-primary bg-background px-3 py-2"
              >
                <div>
                  <p className="font-mono font-semibold uppercase">
                    {h.toStatus}
                  </p>
                  {h.note ? (
                    <p className="text-muted-foreground">{h.note}</p>
                  ) : null}
                  {h.changedByName ? (
                    <p className="text-[10px] text-muted-foreground">
                      By {h.changedByName}
                    </p>
                  ) : null}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
