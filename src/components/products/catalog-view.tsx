"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CatalogProductCardDTO } from "@/services/product.service";
import { ProductCard } from "./product-card";

export interface FilterCategoryOption {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

export interface CatalogViewProps {
  title: string;
  description?: string | null;
  products: CatalogProductCardDTO[];
  total: number;
  page: number;
  totalPages: number;
  categories: FilterCategoryOption[];
  sizes: { id: string; name: string; code: string }[];
  colors: { id: string; name: string; hexCode: string }[];
  lockedCategorySlug?: string;
}

export function CatalogView({
  title,
  description,
  products,
  total,
  page,
  totalPages,
  categories,
  sizes,
  colors,
  lockedCategorySlug,
}: CatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const currentCategory =
    lockedCategorySlug ?? searchParams.get("category") ?? "";
  const currentSize = searchParams.get("size") ?? "";
  const currentColor = searchParams.get("color") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentInStock = searchParams.get("inStock") === "true";
  const currentDiscounted = searchParams.get("discounted") === "true";
  const currentSort = searchParams.get("sort") ?? "featured";

  const [minPriceDraft, setMinPriceDraft] = React.useState(currentMinPrice);
  const [maxPriceDraft, setMaxPriceDraft] = React.useState(currentMaxPrice);

  React.useEffect(() => {
    setMinPriceDraft(currentMinPrice);
    setMaxPriceDraft(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    if (!("page" in updates)) {
      next.delete("page");
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) next.set("q", q);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const filterPanel = (
    <div className="flex flex-col gap-6">
      {!lockedCategorySlug ? (
        <div>
          <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Category
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => updateParams({ category: null })}
              className={`border px-3 py-2 text-left font-mono text-xs uppercase transition-colors cursor-pointer ${
                !currentCategory
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              All Departments
            </button>
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => updateParams({ category: cat.slug })}
                  className={`border px-3 py-2 text-left font-mono text-xs uppercase transition-colors cursor-pointer ${
                    currentCategory === cat.slug
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
                {cat.children && cat.children.length > 0 ? (
                  <div className="ml-3 flex flex-col gap-1 border-l border-border pl-2">
                    {cat.children.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => updateParams({ category: sub.slug })}
                        className={`px-2 py-1 text-left font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                          currentCategory === sub.slug
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Price Range
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({
              minPrice: minPriceDraft || null,
              maxPrice: maxPriceDraft || null,
            });
          }}
          className="flex flex-col gap-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Min"
              value={minPriceDraft}
              onChange={(e) => setMinPriceDraft(e.target.value)}
            />
            <Input
              type="number"
              min={0}
              placeholder="Max"
              value={maxPriceDraft}
              onChange={(e) => setMaxPriceDraft(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Apply Price
          </Button>
        </form>
      </div>

      <div>
        <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Size
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {sizes.map((size) => {
            const active =
              currentSize.toLowerCase() === size.code.toLowerCase();
            return (
              <button
                key={size.id}
                type="button"
                onClick={() =>
                  updateParams({ size: active ? null : size.code })
                }
                className={`border py-2 font-mono text-xs uppercase transition-colors cursor-pointer ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary"
                }`}
              >
                {size.code}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Color
        </p>
        <div className="flex flex-col gap-1.5">
          {colors.map((color) => {
            const active =
              currentColor.toLowerCase() === color.name.toLowerCase();
            return (
              <button
                key={color.id}
                type="button"
                onClick={() =>
                  updateParams({ color: active ? null : color.name })
                }
                className={`flex items-center justify-between border px-3 py-2 font-mono text-xs uppercase transition-colors cursor-pointer ${
                  active
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{color.name}</span>
                <span
                  className="h-3.5 w-3.5 border border-border"
                  style={{ backgroundColor: color.hexCode }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <label className="flex items-center gap-2.5 font-mono text-xs uppercase cursor-pointer">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) =>
              updateParams({ inStock: e.target.checked ? "true" : null })
            }
            className="h-4 w-4 accent-primary"
          />
          <span>In Stock Only</span>
        </label>

        <label className="flex items-center gap-2.5 font-mono text-xs uppercase cursor-pointer">
          <input
            type="checkbox"
            checked={currentDiscounted}
            onChange={(e) =>
              updateParams({ discounted: e.target.checked ? "true" : null })
            }
            className="h-4 w-4 accent-primary"
          />
          <span>On Offer / Discounted</span>
        </label>
      </div>

      <Button variant="outline" size="sm" onClick={clearAllFilters}>
        <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>Reset Filters</span>
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {total} {total === 1 ? "Product" : "Products"} Found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
            <span>Filters</span>
          </Button>

          <div className="w-52">
            <Select
              aria-label="Sort products"
              value={currentSort}
              onChange={(e) => updateParams({ sort: e.target.value })}
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="best_selling">Sort: Best Selling</option>
              <option value="highest_discount">Sort: Highest Discount</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">{filterPanel}</aside>

        <div className="lg:col-span-9">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-border bg-card py-20 text-center">
              <p className="font-mono text-sm font-semibold uppercase tracking-wider">
                No matching garments found
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Adjust your active filters or clear criteria to explore the full
                catalog.
              </p>
              <Button
                variant="primary"
                className="mt-6"
                onClick={clearAllFilters}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-2 border-t border-border pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  <span className="px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => updateParams({ page: String(page + 1) })}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <Drawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        side="left"
        title="Filter Catalog"
      >
        {filterPanel}
      </Drawer>
    </div>
  );
}
