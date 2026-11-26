import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogFilterSchema } from "@/lib/validations/catalog.schema";
import { listActiveCategories } from "@/services/category.service";
import { getCollectionBySlug } from "@/services/collection.service";
import {
  listCatalogProducts,
  listFilterOptions,
} from "@/services/product.service";
import { CatalogView } from "@/components/products/catalog-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection Not Found" };
  return {
    title: collection.name,
    description:
      collection.description ?? `Explore the ${collection.name} edit.`,
  };
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const collection = await getCollectionBySlug(slug);
  if (!collection || !collection.isActive) {
    notFound();
  }

  const parsed = catalogFilterSchema.parse({
    collection: slug,
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

  return (
    <CatalogView
      title={collection.name}
      description={collection.description}
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
