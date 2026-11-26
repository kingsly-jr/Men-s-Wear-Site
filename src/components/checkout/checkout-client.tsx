"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentMethod } from "@prisma/client";
import { CheckCircle2, CreditCard, Lock, MapPin, ShieldCheck } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { addressSchema } from "@/lib/validations/auth.schema";
import { useStore } from "@/components/layout/store-context";

type AddressInputValues = z.input<typeof addressSchema>;
type AddressOutputValues = z.output<typeof addressSchema>;

export interface SavedAddressView {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function CheckoutClient({
  savedAddresses,
}: {
  savedAddresses: SavedAddressView[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, refreshCart, applyCoupon, removeCoupon } = useStore();

  const defaultAddr =
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;

  const [selectedAddressId, setSelectedAddressId] = React.useState<
    string | "new"
  >(defaultAddr ? defaultAddr.id : "new");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    PaymentMethod.CASH_ON_DELIVERY
  );
  const [notes, setNotes] = React.useState("");
  const [couponInput, setCouponInput] = React.useState("");
  const [placingOrder, setPlacingOrder] = React.useState(false);

  const {
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<AddressInputValues, unknown, AddressOutputValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "India", isDefault: false },
  });

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Nothing to Check Out
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add garments to your shopping bag before starting checkout.
        </p>
        <Link href="/shop" className="mt-6 inline-block">
          <Button>Return to Shop</Button>
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    let payload: Record<string, unknown> = {
      paymentMethod,
      couponCode: cart.appliedCoupon?.code ?? "",
      notes,
    };

    if (selectedAddressId === "new") {
      const valid = await trigger();
      if (!valid) {
        toast({
          title: "Complete shipping address",
          description: "Please fill all required address fields.",
          variant: "error",
        });
        return;
      }
      const values = getValues();
      payload = {
        ...payload,
        shippingAddress: {
          fullName: values.fullName,
          phone: values.phone,
          line1: values.line1,
          line2: values.line2,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
        },
      };
    } else {
      payload = {
        ...payload,
        addressId: selectedAddressId,
      };
    }

    setPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Checkout failed",
          description: data?.error?.message ?? "Unable to place order.",
          variant: "error",
        });
        return;
      }

      await refreshCart();
      toast({
        title: "Order placed",
        description: `Order ${data.order.orderNumber} recorded.`,
        variant: "success",
      });
      router.push(`/account/orders/${data.order.id}?placed=true`);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider sm:text-3xl">
            Secure Checkout
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Server-verified inventory reservation and atomic order confirmation.
          </p>
        </div>
        <Lock className="h-5 w-5 text-primary" strokeWidth={1.75} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* 1. Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>1. Shipping Destination</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {savedAddresses.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedAddresses.map((addr) => {
                    const selected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={cn(
                          "border p-3.5 text-left text-xs transition-colors cursor-pointer",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold uppercase">
                            {addr.label || addr.fullName}
                          </span>
                          {selected ? (
                            <CheckCircle2
                              className="h-4 w-4 text-primary"
                              strokeWidth={1.75}
                            />
                          ) : null}
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          {addr.fullName} &middot; {addr.phone}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                          {addr.state} {addr.postalCode}
                        </p>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId("new")}
                    className={cn(
                      "flex items-center justify-center border p-3.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer",
                      selectedAddressId === "new"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    + Enter New Address
                  </button>
                </div>
              ) : null}

              {selectedAddressId === "new" ? (
                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="chk-fullName">Full Name</Label>
                    <Input
                      id="chk-fullName"
                      className="mt-1"
                      {...register("fullName")}
                    />
                    {errors.fullName ? (
                      <p className="mt-1 text-xs text-primary">
                        {errors.fullName.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="chk-phone">Phone</Label>
                    <Input
                      id="chk-phone"
                      className="mt-1"
                      {...register("phone")}
                    />
                    {errors.phone ? (
                      <p className="mt-1 text-xs text-primary">
                        {errors.phone.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="chk-line1">Address Line 1</Label>
                    <Input
                      id="chk-line1"
                      className="mt-1"
                      {...register("line1")}
                    />
                    {errors.line1 ? (
                      <p className="mt-1 text-xs text-primary">
                        {errors.line1.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="chk-line2">Address Line 2 (Optional)</Label>
                    <Input
                      id="chk-line2"
                      className="mt-1"
                      {...register("line2")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chk-city">City</Label>
                    <Input
                      id="chk-city"
                      className="mt-1"
                      {...register("city")}
                    />
                    {errors.city ? (
                      <p className="mt-1 text-xs text-primary">
                        {errors.city.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="chk-state">State</Label>
                    <Input
                      id="chk-state"
                      className="mt-1"
                      {...register("state")}
                    />
                    {errors.state ? (
                      <p className="mt-1 text-xs text-primary">
                        {errors.state.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="chk-postal">Postal / PIN Code</Label>
                    <Input
                      id="chk-postal"
                      className="mt-1"
                      {...register("postalCode")}
                    />
                    {errors.postalCode ? (
                      <p className="mt-1 text-xs text-primary">
                        {errors.postalCode.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="chk-country">Country</Label>
                    <Input
                      id="chk-country"
                      className="mt-1"
                      {...register("country")}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* 2. Payment Method Abstraction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard
                  className="h-4 w-4 text-primary"
                  strokeWidth={1.75}
                />
                <span>2. Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                {
                  method: PaymentMethod.CASH_ON_DELIVERY,
                  title: "Cash on Delivery",
                  desc: "Pay upon physical delivery. Order starts with PENDING payment status.",
                },
                {
                  method: PaymentMethod.BANK_TRANSFER,
                  title: "Direct Bank Transfer",
                  desc: "Order recorded as AWAITING_CONFIRMATION until store verifies remittance.",
                },
                {
                  method: PaymentMethod.MANUAL_INVOICE,
                  title: "Concierge Invoice Settlement",
                  desc: "Dedicated payment link/invoice handled by Crimson Terminal administration.",
                },
              ].map((option) => {
                const selected = paymentMethod === option.method;
                return (
                  <button
                    key={option.method}
                    type="button"
                    onClick={() => setPaymentMethod(option.method)}
                    className={cn(
                      "flex items-start justify-between border p-4 text-left transition-colors cursor-pointer",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-foreground"
                    )}
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold uppercase tracking-wider">
                        {option.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {option.desc}
                      </p>
                    </div>
                    {selected ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-primary"
                        strokeWidth={1.75}
                      />
                    ) : null}
                  </button>
                );
              })}

              <div className="mt-2">
                <Label htmlFor="chk-notes">Delivery / Tailoring Notes</Label>
                <Textarea
                  id="chk-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery instructions..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Review */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Order Review ({cart.itemCount} items)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col divide-y divide-border border border-border bg-background">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {item.productName}
                      </p>
                      <p className="font-mono text-[11px] uppercase text-muted-foreground">
                        {item.sizeName} / {item.colorName} &times;{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatCurrency(item.lineTotal, cart.currencyCode)}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                {cart.appliedCoupon ? (
                  <div className="flex items-center justify-between border border-primary/60 bg-primary/10 px-3 py-2 text-xs">
                    <span className="font-mono uppercase text-primary">
                      Coupon: {cart.appliedCoupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCoupon()}
                      className="font-mono text-[11px] uppercase underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!couponInput.trim()) return;
                      const ok = await applyCoupon(couponInput.trim());
                      if (ok) setCouponInput("");
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Apply coupon code"
                      className="font-mono text-xs uppercase"
                    />
                    <Button type="submit" variant="secondary">
                      Apply
                    </Button>
                  </form>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(cart.subtotal, cart.currencyCode)}
                  </span>
                </div>
                {cart.discountAmount > 0 ? (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrency(cart.discountAmount, cart.currencyCode)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono tabular-nums">
                    {cart.shippingAmount === 0
                      ? "FREE"
                      : formatCurrency(cart.shippingAmount, cart.currencyCode)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(cart.taxAmount, cart.currencyCode)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold">
                  <span className="font-mono uppercase">Total Payable</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(cart.totalAmount, cart.currencyCode)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                isLoading={placingOrder}
                onClick={handlePlaceOrder}
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                <span>Confirm &amp; Place Order</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
