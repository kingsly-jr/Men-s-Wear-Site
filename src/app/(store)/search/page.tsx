import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { catalogFilterSchema } from "@/lib/validations/catalog.schema";
import { listActiveCategories } from "@/services/category.service";
import {
  listCatalogProducts,
  listFilterOptions,
} from "@/services/product.service";
import { CatalogView } from "@/components/products/catalog-view";

export const metadata: Metadata = {
  title: "Search Catalog",
  description: "Search men's fashion products by name, category, SKU, or fabric.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";

  const parsed = catalogFilterSchema.parse({
    q: query || undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    minPrice: typeof sp.minPrice === "string" ? sp.minPrice : undefined,
    maxPrice: typeof sp.maxPrice === "string" ? sp.maxPrice : undefined,
    size: typeof sp.size === "string" ? sp.size : undefined,
    color: typeof sp.color === "string" ? sp.color : undefined,
    inStock: typeof sp.inStock === "string" ? sp.inStock : undefined,
    discounted: typeof sp.discounted === "string" ? sp.discounted : undefined,
    sort: typeof sp.sort === "string" ? sp.sort : "featured",
    page: typeof sp.page === "string" ? sp.page : 1,
    pageSize: 12,
  });

  const [catalog, categories, filterOptions] = await Promise.all([
    listCatalogProducts(parsed),
    listActiveCategories(),
    listFilterOptions(),
  ]);

  if (!query) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <Search
          className="mx-auto mb-4 h-10 w-10 text-primary"
          strokeWidth={1.5}
        />
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Search Crimson Terminal
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the search bar in the header or select a department below to
          explore garments.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="border border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider hover:border-primary"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <CatalogView
      title={`Results for "${query}"`}
      description="Indexed matches across garment names, SKUs, fabrics, and departments."
      products={catalog.items}
      total={catalog.total}
      page={catalog.page}
      totalPages={catalog.totalPages}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))}
      sizes={filterOptions.sizes}
      colors={filterOptions.colors}
    />
  );
}
