"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { useStore } from "@/components/layout/store-context";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    isMutatingCart,
    updateCartItem,
    removeCartItem,
  } = useStore();

  const remainingForFreeShipping = Math.max(
    0,
    cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount)
  );
  const progressPercent = Math.min(
    100,
    Math.round(
      ((cart.subtotal - cart.discountAmount) /
        Math.max(1, cart.freeShippingThreshold)) *
        100
    )
  );

  return (
    <Drawer
      open={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      side="right"
      title={`Shopping Bag (${cart.itemCount})`}
    >
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex flex-col gap-4">
          {cart.items.length > 0 ? (
            <div className="border border-border bg-background p-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {remainingForFreeShipping === 0
                  ? "Complimentary shipping unlocked"
                  : `Add ${formatCurrency(remainingForFreeShipping, cart.currencyCode)} more for free shipping`}
              </p>
              <div className="mt-2 h-1.5 w-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-border bg-background py-14 text-center">
              <ShoppingBag
                className="mb-3 h-8 w-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="font-mono text-xs uppercase tracking-wider text-foreground">
                Your shopping bag is empty
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Explore our tailored menswear catalog to add items.
              </p>
              <Link
                href="/shop"
                onClick={() => setIsCartOpen(false)}
                className="mt-5 inline-flex h-9 items-center border border-primary bg-primary px-4 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-accent"
              >
                Explore Shop
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border border border-border">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-background p-3">
                  <div className="relative h-20 w-16 shrink-0 border border-border bg-card">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${item.productSlug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs font-medium text-foreground hover:text-primary"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-0.5 font-mono text-[11px] uppercase text-muted-foreground">
                          {item.sizeName} / {item.colorName}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isMutatingCart}
                        onClick={() => removeCartItem(item.id)}
                        aria-label={`Remove ${item.productName}`}
                        className="text-muted-foreground hover:text-primary cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border">
                        <button
                          type="button"
                          disabled={isMutatingCart}
                          onClick={() =>
                            updateCartItem(item.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="flex h-7 w-7 items-center justify-center hover:bg-secondary cursor-pointer"
                        >
                          <Minus className="h-3 w-3" strokeWidth={1.75} />
                        </button>
                        <span className="w-8 text-center font-mono text-xs tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={
                            isMutatingCart ||
                            item.quantity >= item.availableStock
                          }
                          onClick={() =>
                            updateCartItem(item.id, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="flex h-7 w-7 items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" strokeWidth={1.75} />
                        </button>
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums">
                        {formatCurrency(item.lineTotal, cart.currencyCode)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.items.length > 0 ? (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-muted-foreground">
                Subtotal
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {formatCurrency(cart.subtotal, cart.currencyCode)}
              </span>
            </div>
            {cart.discountAmount > 0 ? (
              <div className="mt-1 flex items-center justify-between text-xs text-primary">
                <span className="font-mono uppercase">Discount</span>
                <span className="font-mono tabular-nums">
                  -{formatCurrency(cart.discountAmount, cart.currencyCode)}
                </span>
              </div>
            ) : null}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Shipping &amp; taxes computed at checkout.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={() => setIsCartOpen(false)}>
                <Button variant="outline" className="w-full">
                  View Bag
                </Button>
              </Link>
              <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                <Button variant="primary" className="w-full">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
