"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { InventoryMovementReason } from "@prisma/client";
import { Boxes, Search, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export interface InventoryVariantRow {
  id: string;
  sku: string;
  productId: string;
  productName: string;
  sizeName: string;
  colorName: string;
  stock: number;
  lowStockThreshold: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

export interface InventoryMovementRow {
  id: string;
  delta: number;
  balanceAfter: number;
  reason: InventoryMovementReason;
  note: string | null;
  createdAt: string;
  variant: {
    sku: string;
    product: { name: string };
    size: { name: string };
    color: { name: string };
  };
  actor: { name: string; email: string } | null;
}

export function InventoryManager({
  initialVariants,
  initialMovements,
  initialFilter = "all",
}: {
  initialVariants: InventoryVariantRow[];
  initialMovements: InventoryMovementRow[];
  initialFilter?: "all" | "low_stock" | "out_of_stock";
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [variants, setVariants] = React.useState(initialVariants);
  const [movements, setMovements] = React.useState(initialMovements);
  const [filter, setFilter] = React.useState<"all" | "low_stock" | "out_of_stock">(
    initialFilter
  );
  const [search, setSearch] = React.useState("");

  const [adjustTarget, setAdjustTarget] =
    React.useState<InventoryVariantRow | null>(null);
  const [delta, setDelta] = React.useState(5);
  const [reason, setReason] = React.useState<"RESTOCK" | "ADJUSTMENT">(
    "RESTOCK"
  );
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const visibleVariants = React.useMemo(() => {
    return variants.filter((v) => {
      if (filter === "low_stock" && !v.isLowStock) return false;
      if (filter === "out_of_stock" && !v.isOutOfStock) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          v.sku.toLowerCase().includes(q) ||
          v.productName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [variants, filter, search]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: adjustTarget.id,
          delta: Number(delta),
          reason,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Adjustment rejected",
          description: data?.error?.message ?? "Invalid stock delta.",
          variant: "error",
        });
        return;
      }

      const freshRes = await fetch("/api/admin/inventory");
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setVariants(freshData.variants);
        setMovements(freshData.movements);
      }

      setAdjustTarget(null);
      setNote("");
      toast({ title: "Inventory adjusted transactionally", variant: "success" });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
            Inventory &amp; Stock Audit
          </h1>
          <p className="text-xs text-muted-foreground">
            Variant-level stock monitoring with immutable transactional movement
            history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "low_stock", "out_of_stock"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "border px-3 py-1.5 font-mono text-xs uppercase cursor-pointer",
                filter === tab
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {tab.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
          strokeWidth={1.75}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by SKU or product name..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span>Variant Stock Levels ({visibleVariants.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted font-mono uppercase text-muted-foreground">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleVariants.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{v.sku}</td>
                  <td className="px-4 py-3">{v.productName}</td>
                  <td className="px-4 py-3 font-mono text-[11px] uppercase text-muted-foreground">
                    {v.sizeName} / {v.colorName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        v.isOutOfStock
                          ? "destructive"
                          : v.isLowStock
                          ? "default"
                          : "outline"
                      }
                    >
                      {v.stock} units
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdjustTarget(v);
                        setDelta(5);
                      }}
                    >
                      <Sliders className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Adjust</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Movements</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted font-mono uppercase text-muted-foreground">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Delta</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold">
                    {m.variant.sku}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline">{m.reason}</Badge>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 font-mono font-bold tabular-nums",
                      m.delta >= 0 ? "text-foreground" : "text-primary"
                    )}
                  >
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">
                    {m.balanceAfter}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {m.note ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(adjustTarget)}
        onClose={() => setAdjustTarget(null)}
        title={`Adjust Stock: ${adjustTarget?.sku ?? ""}`}
        description={`Current stock: ${adjustTarget?.stock ?? 0} units`}
      >
        <form onSubmit={handleAdjust} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="adj-reason">Movement Reason</Label>
            <Select
              id="adj-reason"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as "RESTOCK" | "ADJUSTMENT")
              }
              className="mt-1"
            >
              <option value="RESTOCK">RESTOCK</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="adj-delta">
              Quantity Delta (positive to add, negative to deduct)
            </Label>
            <Input
              id="adj-delta"
              type="number"
              required
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="adj-note">Audit Note</Label>
            <Input
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Supplier shipment #204"
              className="mt-1"
            />
          </div>
          <Button type="submit" isLoading={submitting}>
            Confirm Stock Adjustment
          </Button>
        </form>
      </Modal>
    </div>
  );
}
