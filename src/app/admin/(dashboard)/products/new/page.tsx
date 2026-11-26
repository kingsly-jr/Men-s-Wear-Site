import { listAdminCategories } from "@/services/category.service";
import { listAdminCollections } from "@/services/collection.service";
import { listFilterOptions } from "@/services/product.service";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const [categories, collections, filterOptions] = await Promise.all([
    listAdminCategories(),
    listAdminCollections(),
    listFilterOptions(),
  ]);

  return (
    <ProductForm
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      collections={collections.map((c) => ({ id: c.id, name: c.name }))}
      sizes={filterOptions.sizes}
      colors={filterOptions.colors}
    />
  );
}
