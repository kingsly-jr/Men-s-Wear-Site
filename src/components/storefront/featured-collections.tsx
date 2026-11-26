"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export interface CollectionTile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

export function FeaturedCollections({
  title,
  subtitle,
  collections,
}: {
  title: string;
  subtitle?: string | null;
  collections: CollectionTile[];
}) {
  if (collections.length === 0) return null;

  return (
    <section className="border-b border-border bg-card py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 border-b border-border pb-5">
          <h2 className="font-mono text-xl font-bold uppercase tracking-wider sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, idx) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.2) }}
            >
              <Link
                href={`/collections/${collection.slug}`}
                className="group flex flex-col border border-border bg-background transition-colors hover:border-primary"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
                  {collection.imageUrl ? (
                    <Image
                      src={collection.imageUrl}
                      alt={collection.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground group-hover:text-primary">
                      {collection.name}
                    </h3>
                    {collection.description ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {collection.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary">
                    <span>Explore Edit</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
