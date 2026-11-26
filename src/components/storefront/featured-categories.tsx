"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export interface CategoryTile {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export function FeaturedCategories({
  title,
  subtitle,
  categories,
}: {
  title: string;
  subtitle?: string | null;
  categories: CategoryTile[];
}) {
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
            href="/shop"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:underline"
          >
            <span>Browse Full Catalog</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.24) }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden border border-border bg-card transition-colors hover:border-primary"
              >
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover opacity-75 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground sm:text-sm">
                    {cat.name}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.75}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
