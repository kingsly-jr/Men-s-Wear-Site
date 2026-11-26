"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import { useStore } from "@/components/layout/store-context";

export interface WishlistItemView {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
  variants: {
    id: string;
    sku: string;
    sizeName: string;
    colorName: string;
    stock: number;
  }[];
}

export function WishlistClient({
  initialItems,
}: {
  initialItems: WishlistItemView[];
}) {
  const { toast } = useToast();
  const { toggleWishlist, refreshCart, setIsCartOpen } = useStore();
  const [items, setItems] = React.useState<WishlistItemView[]>(initialItems);
  const [selectedVariants, setSelectedVariants] = React.useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {};
    for (const item of initialItems) {
      const firstInStock =
        item.variants.find((v) => v.stock > 0) ?? item.variants[0];
      if (firstInStock) {
        map[item.productId] = firstInStock.id;
      }
    }
    return map;
  });
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleMoveToCart = async (productId: string) => {
    const variantId = selectedVariants[productId];
    if (!variantId) {
      toast({
        title: "Select a variant",
        description: "Choose a size and color before moving to bag.",
        variant: "error",
      });
      return;
    }

    setMovingId(productId);
    try {
      const res = await fetch("/api/wishlist/move-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Unable to move item",
          description: data?.error?.message ?? "Please try again.",
          variant: "error",
        });
        return;
      }

      setItems((prev) => prev.filter((i) => i.productId !== productId));
      await refreshCart();
      setIsCartOpen(true);
      toast({ title: "Moved to shopping bag", variant: "success" });
    } finally {
      setMovingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <Heart
          className="mx-auto mb-4 h-10 w-10 text-muted-foreground"
          strokeWidth={1.5}
        />
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Your Wishlist is Empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save tailored garments while browsing to revisit or move them to your
          bag later.
        </p>
        <Link href="/shop" className="mt-6 inline-block">
          <Button>Explore Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border pb-5">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider sm:text-3xl">
          Saved Wishlist ({items.length})
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col border border-border bg-card"
          >
            <Link
              href={`/products/${item.slug}`}
              className="relative aspect-[3/4] border-b border-border bg-background"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : null}
            </Link>

            <div className="flex flex-1 flex-col justify-between gap-4 p-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {item.category.name}
                </p>
                <Link
                  href={`/products/${item.slug}`}
                  className="mt-1 block text-sm font-semibold hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 font-mono text-sm font-bold tabular-nums">
                  {formatCurrency(item.price)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Select
                  aria-label={`Select variant for ${item.name}`}
                  value={selectedVariants[item.productId] ?? ""}
                  onChange={(e) =>
                    setSelectedVariants((prev) => ({
                      ...prev,
                      [item.productId]: e.target.value,
                    }))
                  }
                >
                  {item.variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                      {v.sizeName} / {v.colorName}{" "}
                      {v.stock <= 0 ? "(Out of stock)" : `(${v.stock} left)`}
                    </option>
                  ))}
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    isLoading={movingId === item.productId}
                    onClick={() => handleMoveToCart(item.productId)}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Move to Bag</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Remove ${item.name} from wishlist`}
                    onClick={() => handleRemove(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
