import { listAdminCategories } from "@/services/category.service";
import { listAdminCollections } from "@/services/collection.service";
import {
  getAdminProductById,
  listFilterOptions,
} from "@/services/product.service";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, collections, filterOptions] = await Promise.all([
    getAdminProductById(id),
    listAdminCategories(),
    listAdminCollections(),
    listFilterOptions(),
  ]);

  return (
    <ProductForm
      mode="edit"
      productId={product.id}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      collections={collections.map((c) => ({ id: c.id, name: c.name }))}
      sizes={filterOptions.sizes}
      colors={filterOptions.colors}
      initialValues={{
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        fabric: product.fabric ?? "",
        material: product.material ?? "",
        careInstructions: product.careInstructions ?? "",
        price: product.price,
        originalPrice: product.originalPrice,
        status: product.status,
        isFeatured: product.isFeatured,
        seoTitle: product.seoTitle ?? "",
        seoDescription: product.seoDescription ?? "",
        categoryId: product.categoryId,
        collectionIds: product.collectionIds,
        specifications: product.specifications.map((s) => ({
          specKey: s.specKey,
          specValue: s.specValue,
          sortOrder: s.sortOrder,
        })),
        images: product.images.map((img) => ({
          url: img.url,
          altText: img.altText ?? "",
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
        variants: product.variants.map((v) => ({
          id: v.id,
          sizeId: v.sizeId,
          colorId: v.colorId,
          sku: v.sku,
          priceOverride: v.priceOverride,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          isActive: v.isActive,
        })),
      }}
    />
  );
}
