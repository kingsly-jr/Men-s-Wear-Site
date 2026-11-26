"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { useStore } from "@/components/layout/store-context";

export function CartPageClient() {
  const {
    cart,
    isMutatingCart,
    updateCartItem,
    removeCartItem,
    applyCoupon,
    removeCoupon,
  } = useStore();
  const [couponInput, setCouponInput] = React.useState("");

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <ShoppingBag
          className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
          strokeWidth={1.5}
        />
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Your Shopping Bag is Empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover heavyweight tees, tailored shirts, and seasonal outerwear in
          our catalog.
        </p>
        <Link href="/shop" className="mt-6 inline-block">
          <Button size="lg">
            <span>Browse Storefront</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border pb-5">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider sm:text-3xl">
          Shopping Bag ({cart.itemCount})
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Line Items */}
        <div className="flex flex-col divide-y divide-border border border-border bg-card lg:col-span-8">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <Link
                href={`/products/${item.productSlug}`}
                className="relative h-28 w-24 shrink-0 border border-border bg-background"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {item.productName}
                </Link>
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  Size: {item.sizeName} &middot; Color: {item.colorName}
                </p>
                <p className="font-mono text-[11px] uppercase text-muted-foreground">
                  SKU: {item.variantSku} &middot; {item.availableStock} available
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="inline-flex items-center border border-border bg-background">
                  <button
                    type="button"
                    disabled={isMutatingCart}
                    onClick={() => updateCartItem(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="flex h-9 w-9 items-center justify-center hover:bg-secondary cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <span className="w-10 text-center font-mono text-xs tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={
                      isMutatingCart || item.quantity >= item.availableStock
                    }
                    onClick={() => updateCartItem(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="flex h-9 w-9 items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="w-24 text-right font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(item.lineTotal, cart.currencyCode)}
                </div>

                <button
                  type="button"
                  disabled={isMutatingCart}
                  onClick={() => removeCartItem(item.id)}
                  aria-label={`Remove ${item.productName}`}
                  className="text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary & Coupon */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Coupon Box */}
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Promo / Coupon Code
                </p>
                {cart.appliedCoupon ? (
                  <div className="flex items-center justify-between border border-primary/60 bg-primary/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                      <Badge variant="default">{cart.appliedCoupon.code}</Badge>
                    </div>
                    <button
                      type="button"
                      disabled={isMutatingCart}
                      onClick={() => removeCoupon()}
                      aria-label="Remove coupon"
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
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
                      placeholder="CRIMSON15"
                      className="font-mono text-xs uppercase"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      isLoading={isMutatingCart}
                    >
                      Apply
                    </Button>
                  </form>
                )}
                {cart.couponWarning ? (
                  <p className="mt-1.5 text-xs text-primary">
                    {cart.couponWarning}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2.5 border-t border-border pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(cart.subtotal, cart.currencyCode)}
                  </span>
                </div>
                {cart.discountAmount > 0 ? (
                  <div className="flex justify-between text-primary">
                    <span>Coupon Discount</span>
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
                  <span className="text-muted-foreground">Estimated Tax</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(cart.taxAmount, cart.currencyCode)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-3 text-sm font-bold">
                  <span className="font-mono uppercase">Total</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(cart.totalAmount, cart.currencyCode)}
                  </span>
                </div>
              </div>

              <Link href="/checkout" className="w-full">
                <Button variant="primary" size="lg" className="w-full">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
