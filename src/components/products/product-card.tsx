"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { useStore } from "@/components/layout/store-context";
import type { CatalogProductCardDTO } from "@/services/product.service";
import { QuickViewModal } from "./quick-view-modal";

export function ProductCard({
  product,
  index = 0,
}: {
  product: CatalogProductCardDTO;
  index?: number;
}) {
  const { wishlistIds, toggleWishlist } = useStore();
  const [quickViewOpen, setQuickViewOpen] = React.useState(false);
  const isSaved = wishlistIds.has(product.id);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
        className="group flex flex-col border border-border bg-card transition-colors hover:border-primary/70"
      >
        <div className="relative aspect-[3/4] overflow-hidden border-b border-border bg-background">
          <Link
            href={`/products/${product.slug}`}
            className="block h-full w-full"
          >
            {product.primaryImageUrl ? (
              <Image
                src={product.primaryImageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-all duration-500 group-hover:scale-[1.03]"
              />
            ) : null}

            {product.secondaryImageUrl &&
            product.secondaryImageUrl !== product.primaryImageUrl ? (
              <Image
                src={product.secondaryImageUrl}
                alt={`${product.name} alternate view`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            ) : null}
          </Link>

          {/* Top Left Badges */}
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {product.discountPercent > 0 ? (
              <Badge variant="default">-{product.discountPercent}%</Badge>
            ) : null}
            {!product.inStock ? (
              <Badge variant="destructive">Sold Out</Badge>
            ) : null}
          </div>

          {/* Top Right Quick Actions */}
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={
                isSaved
                  ? `Remove ${product.name} from wishlist`
                  : `Add ${product.name} to wishlist`
              }
              className={cn(
                "flex h-9 w-9 items-center justify-center border border-border bg-background/90 transition-colors hover:border-primary cursor-pointer",
                isSaved ? "text-primary" : "text-foreground"
              )}
            >
              <Heart
                className={cn("h-4 w-4", isSaved ? "fill-primary" : "")}
                strokeWidth={1.75}
              />
            </button>

            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              aria-label={`Quick view ${product.name}`}
              className="flex h-9 w-9 items-center justify-center border border-border bg-background/90 text-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer"
            >
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {product.category.name}
            </p>
            <Link
              href={`/products/${product.slug}`}
              className="mt-1 block text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {product.name}
            </Link>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice &&
              product.originalPrice > product.price ? (
                <span className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                  {formatCurrency(product.originalPrice)}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1" aria-label="Available colors">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color.id}
                  title={color.name}
                  className="inline-block h-3 w-3 border border-border"
                  style={{ backgroundColor: color.hexCode }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.article>

      <QuickViewModal
        slug={product.slug}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
