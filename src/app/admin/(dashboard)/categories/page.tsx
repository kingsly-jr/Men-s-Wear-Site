import { listAdminCategories } from "@/services/category.service";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  return <CategoriesManager initialCategories={categories} />;
}
