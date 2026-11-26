import { listAdminProducts } from "@/services/product.service";
import { ProductsTable } from "@/components/admin/products-table";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  return <ProductsTable initialProducts={products} />;
}
