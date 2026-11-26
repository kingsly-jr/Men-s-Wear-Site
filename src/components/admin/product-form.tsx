"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductStatus } from "@prisma/client";
import { Plus, Save, Trash2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils/slug";
import { productUpsertSchema } from "@/lib/validations/catalog.schema";

type ProductInputValues = z.input<typeof productUpsertSchema>;
type ProductOutputValues = z.output<typeof productUpsertSchema>;

export interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: ProductInputValues;
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  sizes: { id: string; name: string; code: string }[];
  colors: { id: string; name: string; hexCode: string }[];
}

export function ProductForm({
  mode,
  productId,
  initialValues,
  categories,
  collections,
  sizes,
  colors,
}: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: ProductInputValues = initialValues ?? {
    name: "",
    slug: "",
    sku: "",
    description: "",
    fabric: "",
    material: "",
    careInstructions: "",
    price: 1999,
    originalPrice: null,
    status: ProductStatus.DRAFT,
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
    categoryId: categories[0]?.id ?? "",
    collectionIds: [],
    specifications: [{ specKey: "Fit", specValue: "Tailored", sortOrder: 0 }],
    images: [{ url: "", altText: "", sortOrder: 0, isPrimary: true }],
    variants: [
      {
        sizeId: sizes[0]?.id ?? "",
        colorId: colors[0]?.id ?? "",
        sku: "",
        priceOverride: null,
        stock: 10,
        lowStockThreshold: 5,
        isActive: true,
      },
    ],
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInputValues, unknown, ProductOutputValues>({
    resolver: zodResolver(productUpsertSchema),
    defaultValues,
  });

  const imagesField = useFieldArray({ control, name: "images" });
  const specsField = useFieldArray({ control, name: "specifications" });
  const variantsField = useFieldArray({ control, name: "variants" });
  const selectedCollectionIds = watch("collectionIds") ?? [];

  const toggleCollection = (id: string) => {
    const exists = selectedCollectionIds.includes(id);
    setValue(
      "collectionIds",
      exists
        ? selectedCollectionIds.filter((c) => c !== id)
        : [...selectedCollectionIds, id]
    );
  };

  const onSubmit = async (values: ProductOutputValues) => {
    const endpoint =
      mode === "create"
        ? "/api/admin/products"
        : `/api/admin/products/${productId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Save failed",
        description: data?.error?.message ?? "Please review product fields.",
        variant: "error",
      });
      return;
    }

    toast({
      title: mode === "create" ? "Product created" : "Product updated",
      variant: "success",
    });
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
            {mode === "create" ? "Create New Product" : "Edit Product"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Normalized catalog record with multi-image gallery and variant SKUs.
          </p>
        </div>
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          <Save className="h-4 w-4" strokeWidth={1.75} />
          <span>{mode === "create" ? "Save Product" : "Update Product"}</span>
        </Button>
      </div>

      {/* Core Details */}
      <Card>
        <CardHeader>
          <CardTitle>Core Catalog Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-name">Product Name</Label>
            <Input
              id="p-name"
              className="mt-1"
              {...register("name", {
                onChange: (e) => {
                  if (mode === "create") {
                    setValue("slug", slugify(e.target.value));
                  }
                },
              })}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-primary">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="p-slug">URL Slug</Label>
            <Input id="p-slug" className="mt-1 font-mono" {...register("slug")} />
            {errors.slug ? (
              <p className="mt-1 text-xs text-primary">{errors.slug.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="p-sku">Base SKU</Label>
            <Input
              id="p-sku"
              className="mt-1 font-mono uppercase"
              {...register("sku")}
            />
            {errors.sku ? (
              <p className="mt-1 text-xs text-primary">{errors.sku.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="p-category">Category</Label>
            <Select
              id="p-category"
              className="mt-1"
              {...register("categoryId")}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="p-price">Selling Price</Label>
            <Input
              id="p-price"
              type="number"
              step="0.01"
              className="mt-1"
              {...register("price", { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label htmlFor="p-orig-price">Original MRP (Optional)</Label>
            <Input
              id="p-orig-price"
              type="number"
              step="0.01"
              className="mt-1"
              {...register("originalPrice", {
                setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
              })}
            />
          </div>

          <div>
            <Label htmlFor="p-status">Status</Label>
            <Select id="p-status" className="mt-1" {...register("status")}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 font-mono text-xs uppercase cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                {...register("isFeatured")}
              />
              <span>Featured on Storefront</span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              className="mt-1"
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-primary">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="p-fabric">Fabric</Label>
            <Input id="p-fabric" className="mt-1" {...register("fabric")} />
          </div>

          <div>
            <Label htmlFor="p-material">Material / Weave</Label>
            <Input id="p-material" className="mt-1" {...register("material")} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="p-care">Care Instructions</Label>
            <Input
              id="p-care"
              className="mt-1"
              {...register("careInstructions")}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Collections</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {collections.map((col) => {
                const checked = selectedCollectionIds.includes(col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleCollection(col.id)}
                    className={`border px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                      checked
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {col.name}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Images</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              imagesField.append({
                url: "",
                altText: "",
                sortOrder: imagesField.fields.length,
                isPrimary: false,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Add Image</span>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {imagesField.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 border border-border bg-background p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-6">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1"
                  {...register(`images.${index}.url`)}
                />
              </div>
              <div className="sm:col-span-4">
                <Label>Alt Text</Label>
                <Input
                  className="mt-1"
                  {...register(`images.${index}.altText`)}
                />
              </div>
              <div className="flex items-end justify-between gap-2 sm:col-span-2">
                <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    {...register(`images.${index}.isPrimary`)}
                  />
                  <span>Primary</span>
                </label>
                {imagesField.fields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => imagesField.remove(index)}
                    aria-label="Remove image"
                    className="text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Normalized Specifications</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              specsField.append({
                specKey: "",
                specValue: "",
                sortOrder: specsField.fields.length,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Add Spec</span>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {specsField.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 border border-border bg-background p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <Input
                  placeholder="Key (e.g. Fit)"
                  {...register(`specifications.${index}.specKey`)}
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  placeholder="Value (e.g. Boxy Architectural)"
                  {...register(`specifications.${index}.specValue`)}
                />
              </div>
              <div className="flex items-center justify-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => specsField.remove(index)}
                  aria-label="Remove specification"
                  className="text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Variant Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Size &amp; Color Variants</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              variantsField.append({
                sizeId: sizes[0]?.id ?? "",
                colorId: colors[0]?.id ?? "",
                sku: "",
                priceOverride: null,
                stock: 0,
                lowStockThreshold: 5,
                isActive: true,
              })
            }
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Add Variant</span>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {variantsField.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 border border-border bg-background p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-2">
                <Label>Size</Label>
                <Select
                  className="mt-1"
                  {...register(`variants.${index}.sizeId`)}
                >
                  {sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Label>Color</Label>
                <Select
                  className="mt-1"
                  {...register(`variants.${index}.colorId`)}
                >
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Label>Variant SKU</Label>
                <Input
                  className="mt-1 font-mono uppercase"
                  placeholder="CT-SKU-M-BLK"
                  {...register(`variants.${index}.sku`)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1"
                  {...register(`variants.${index}.stock`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="flex items-end justify-between gap-2 sm:col-span-2">
                <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    {...register(`variants.${index}.isActive`)}
                  />
                  <span>Active</span>
                </label>
                {variantsField.fields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => variantsField.remove(index)}
                    aria-label="Remove variant"
                    className="text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </form>
  );
}
