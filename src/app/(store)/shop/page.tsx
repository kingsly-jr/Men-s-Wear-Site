import type { Metadata } from "next";
import { catalogFilterSchema } from "@/lib/validations/catalog.schema";
import { listActiveCategories } from "@/services/category.service";
import {
  listCatalogProducts,
  listFilterOptions,
} from "@/services/product.service";
import { CatalogView } from "@/components/products/catalog-view";

export const metadata: Metadata = {
  title: "Shop All Menswear",
  description:
    "Browse tailored shirts, heavyweight tees, trousers, jackets, and seasonal menswear essentials.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = catalogFilterSchema.parse({
    category: typeof sp.category === "string" ? sp.category : undefined,
    collection: typeof sp.collection === "string" ? sp.collection : undefined,
    q: typeof sp.q === "string" ? sp.q : undefined,
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

  const topCategories = categories
    .filter((c) => !c.parentId)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      children: c.children.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
      })),
    }));

  return (
    <CatalogView
      title={parsed.discounted ? "Offers & Markdowns" : "All Menswear"}
      description="Filter by silhouette, size, color, price range, and availability."
      products={catalog.items}
      total={catalog.total}
      page={catalog.page}
      totalPages={catalog.totalPages}
      categories={topCategories}
      sizes={filterOptions.sizes}
      colors={filterOptions.colors}
    />
  );
}
