"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ProductStatus } from "@prisma/client";
import { ArrowUpDown, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  category: { id: string; name: string };
  variantCount: number;
  totalStock: number;
}

const columnHelper = createColumnHelper<AdminProductRow>();

export function ProductsTable({
  initialProducts,
}: {
  initialProducts: AdminProductRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = React.useState(initialProducts);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [bulkStatus, setBulkStatus] = React.useState<ProductStatus>(
    ProductStatus.PUBLISHED
  );
  const [busy, setBusy] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (statusFilter === "ALL") return products;
    return products.filter((p) => p.status === statusFilter);
  }, [products, statusFilter]);

  const handleDelete = React.useCallback(
    async (id: string, name: string) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Action failed",
          description: data?.error?.message ?? "Unable to remove product.",
          variant: "error",
        });
        return;
      }

      if (data.archived) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: ProductStatus.ARCHIVED } : p
          )
        );
        toast({
          title: "Product archived",
          description: `${name} has order history and was archived safely.`,
        });
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast({ title: "Product deleted", variant: "default" });
      }
    },
    [toast]
  );

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all products"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 accent-primary"
          />
        ),
      }),
      columnHelper.accessor("name", {
        header: "Product",
        cell: (info) => (
          <div>
            <Link
              href={`/admin/products/${info.row.original.id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {info.getValue()}
            </Link>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              {info.row.original.sku}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.category.name, {
        id: "category",
        header: "Category",
      }),
      columnHelper.accessor("price", {
        header: "Price",
        cell: (info) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("totalStock", {
        header: "Stock",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge
              variant={
                val === 0 ? "destructive" : val <= 5 ? "default" : "outline"
              }
            >
              {val} units ({info.row.original.variantCount} var)
            </Badge>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/products/${row.original.id}`}
              aria-label={`Edit ${row.original.name}`}
              className="inline-flex h-8 w-8 items-center justify-center border border-border hover:border-primary"
            >
              <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(row.original.id, row.original.name)}
              aria-label={`Delete or archive ${row.original.name}`}
              className="inline-flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ),
      }),
    ],
    [handleDelete]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedIds, status: bulkStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedIds.includes(p.id) ? { ...p, status: bulkStatus } : p
          )
        );
        setRowSelection({});
        toast({
          title: `Updated ${selectedIds.length} product(s)`,
          variant: "success",
        });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
            Products ({products.length})
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage catalog entries, multi-variant SKUs, pricing, and publishing
            status.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button variant="primary">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            <span>Create Product</span>
          </Button>
        </Link>
      </div>

      {/* Filters & Bulk Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search name or SKU..."
              className="pl-9"
            />
          </div>

          <div className="w-40">
            <Select
              aria-label="Filter by product status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 border border-primary/50 bg-card px-3 py-1.5">
            <span className="font-mono text-xs uppercase">
              {selectedIds.length} selected
            </span>
            <Select
              aria-label="Bulk status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ProductStatus)}
              className="h-8 w-36 text-xs"
            >
              <option value="PUBLISHED">Publish</option>
              <option value="DRAFT">Move to Draft</option>
              <option value="ARCHIVED">Archive</option>
            </Select>
            <Button size="sm" isLoading={busy} onClick={handleBulkUpdate}>
              Apply
            </Button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-muted font-mono uppercase text-muted-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-muted-foreground"
                >
                  No products match your filter criteria.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-background/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
