"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { resolveEffectivePrice } from "@/lib/utils/pricing";
import { cn } from "@/lib/utils/cn";
import { useStore } from "@/components/layout/store-context";

interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  images: { id: string; url: string; altText: string | null }[];
  variants: {
    id: string;
    sku: string;
    stock: number;
    priceOverride: number | null;
    size: { id: string; name: string; code: string };
    color: { id: string; name: string; hexCode: string };
  }[];
}

export function QuickViewModal({
  slug,
  open,
  onClose,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
}) {
  const { addToCart, isMutatingCart } = useStore();
  const [product, setProduct] = React.useState<QuickViewProduct | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: QuickViewProduct | null) => {
        if (!active || !data) return;
        setProduct(data);
        const firstAvailable =
          data.variants.find((v) => v.stock > 0) ?? data.variants[0];
        setSelectedVariantId(firstAvailable?.id ?? "");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, slug]);

  const activeVariant = product?.variants.find(
    (v) => v.id === selectedVariantId
  );
  const effectivePrice = product
    ? resolveEffectivePrice(product.price, activeVariant?.priceOverride ?? null)
    : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product?.name ?? "Quick View"}
      className="max-w-2xl"
    >
      {loading || !product ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-[3/4] border border-border bg-background">
            {product.images[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                sizes="320px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold tabular-nums">
                  {formatCurrency(effectivePrice)}
                </span>
                {product.originalPrice &&
                product.originalPrice > effectivePrice ? (
                  <span className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                    {formatCurrency(product.originalPrice)}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">
                {product.description}
              </p>

              <div className="mt-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Select Variant
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => {
                    const selected = variant.id === selectedVariantId;
                    const out = variant.stock <= 0;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={out}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={cn(
                          "flex items-center justify-between border px-2.5 py-2 text-left font-mono text-[11px] uppercase transition-colors cursor-pointer disabled:opacity-40",
                          selected
                            ? "border-primary bg-primary/15 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-foreground"
                        )}
                      >
                        <span>
                          {variant.size.code} / {variant.color.name}
                        </span>
                        <span
                          className="h-2.5 w-2.5 border border-border"
                          style={{ backgroundColor: variant.color.hexCode }}
                        />
                      </button>
                    );
                  })}
                </div>
                {activeVariant ? (
                  <p className="mt-2 font-mono text-[11px] uppercase text-muted-foreground">
                    {activeVariant.stock > 0
                      ? `${activeVariant.stock} in stock (${activeVariant.sku})`
                      : "Currently out of stock"}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                disabled={!activeVariant || activeVariant.stock <= 0}
                isLoading={isMutatingCart}
                onClick={async () => {
                  if (!activeVariant) return;
                  const ok = await addToCart(activeVariant.id, 1, true);
                  if (ok) onClose();
                }}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                <span>Add to Bag</span>
              </Button>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center gap-2 border border-border font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary"
              >
                <span>View Full Details</span>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
