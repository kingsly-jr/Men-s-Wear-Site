import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { listActiveCollections } from "@/services/collection.service";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated seasonal and foundational menswear collections.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsIndexPage() {
  const collections = await listActiveCollections();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 border-b border-border pb-6">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider sm:text-3xl">
          Curated Collections
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cohesive architectural edits built for everyday essentials, smart
          casual, formal tailoring, and seasonal layering.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            className="group flex flex-col border border-border bg-card transition-colors hover:border-primary"
          >
            <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-background">
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
                <h2 className="font-mono text-base font-semibold uppercase tracking-wider group-hover:text-primary">
                  {collection.name}
                </h2>
                {collection.description ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {collection.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>{collection._count.products} Pieces</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <span>View Edit</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
