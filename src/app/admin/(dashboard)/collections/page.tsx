import { listAdminCollections } from "@/services/collection.service";
import { listAdminProducts } from "@/services/product.service";
import { CollectionsManager } from "@/components/admin/collections-manager";

export default async function AdminCollectionsPage() {
  const [collections, products] = await Promise.all([
    listAdminCollections(),
    listAdminProducts(),
  ]);

  return (
    <CollectionsManager
      initialCollections={collections}
      allProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      }))}
    />
  );
}
