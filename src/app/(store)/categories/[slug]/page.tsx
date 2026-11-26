import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogFilterSchema } from "@/lib/validations/catalog.schema";
import {
  getCategoryBySlug,
  listActiveCategories,
} from "@/services/category.service";
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
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} menswear.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category || !category.isActive) {
    notFound();
  }

  const parsed = catalogFilterSchema.parse({
    category: slug,
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
      title={category.name}
      description={category.description}
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
      lockedCategorySlug={slug}
    />
  );
}
