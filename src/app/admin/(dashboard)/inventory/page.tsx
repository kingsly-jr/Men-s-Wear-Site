import {
  listInventoryMovements,
  listInventoryVariants,
} from "@/services/inventory.service";
import { InventoryManager } from "@/components/admin/inventory-manager";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filterParam = typeof sp.filter === "string" ? sp.filter : "all";
  const initialFilter =
    filterParam === "low_stock" || filterParam === "out_of_stock"
      ? filterParam
      : "all";

  const [variants, movements] = await Promise.all([
    listInventoryVariants({ filter: "all" }),
    listInventoryMovements(80),
  ]);

  return (
    <InventoryManager
      initialVariants={variants}
      initialMovements={movements.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialFilter={initialFilter}
    />
  );
}
