"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import type { CatalogProductCardDTO } from "@/services/product.service";

export function ProductRail({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle?: string | null;
  href: string;
  products: CatalogProductCardDTO[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="border-b border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-mono text-xl font-bold uppercase tracking-wider sm:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
