"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DiscountType } from "@prisma/client";
import { Edit3, Plus, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

export interface AdminCouponRow {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export function CouponsManager({
  initialCoupons,
}: {
  initialCoupons: AdminCouponRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = React.useState(initialCoupons);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [discountType, setDiscountType] = React.useState<DiscountType>(
    DiscountType.PERCENTAGE
  );
  const [discountValue, setDiscountValue] = React.useState(15);
  const [minOrderAmount, setMinOrderAmount] = React.useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("");
  const [perCustomerLimit, setPerCustomerLimit] = React.useState("1");
  const [startsAt, setStartsAt] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setDescription("");
    setDiscountType(DiscountType.PERCENTAGE);
    setDiscountValue(15);
    setMinOrderAmount("");
    setMaxDiscountAmount("");
    setUsageLimit("");
    setPerCustomerLimit("1");
    setStartsAt("");
    setExpiresAt("");
    setIsActive(true);
  };

  const loadForEdit = (c: AdminCouponRow) => {
    setEditingId(c.id);
    setCode(c.code);
    setDescription(c.description ?? "");
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount !== null ? String(c.minOrderAmount) : "");
    setMaxDiscountAmount(
      c.maxDiscountAmount !== null ? String(c.maxDiscountAmount) : ""
    );
    setUsageLimit(c.usageLimit !== null ? String(c.usageLimit) : "");
    setPerCustomerLimit(
      c.perCustomerLimit !== null ? String(c.perCustomerLimit) : ""
    );
    setStartsAt(c.startsAt ? c.startsAt.slice(0, 10) : "");
    setExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 10) : "");
    setIsActive(c.isActive);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingId
        ? `/api/admin/coupons/${editingId}`
        : "/api/admin/coupons";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
          maxDiscountAmount: maxDiscountAmount
            ? Number(maxDiscountAmount)
            : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : null,
          startsAt: startsAt || null,
          expiresAt: expiresAt || null,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save failed",
          description: data?.error?.message ?? "Check coupon fields.",
          variant: "error",
        });
        return;
      }

      const fresh = await fetch("/api/admin/coupons");
      if (fresh.ok) {
        const freshData = (await fresh.json()) as { coupons: AdminCouponRow[] };
        setCoupons(freshData.coupons);
      }

      toast({
        title: editingId ? "Coupon updated" : "Coupon created",
        variant: "success",
      });
      resetForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Delete blocked",
        description: data?.error?.message ?? "Cannot delete coupon.",
        variant: "error",
      });
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Coupon deleted" });
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Coupons &amp; Discounts ({coupons.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">
                      {c.code}
                    </span>
                    <Badge variant={c.isActive ? "default" : "outline"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="secondary">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}%`
                        : `Flat ${c.discountValue}`}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {c.description || "No description"} &middot; Used{" "}
                    {c.usedCount}
                    {c.usageLimit ? `/${c.usageLimit}` : ""} time(s)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadForEdit(c)}
                    aria-label={`Edit ${c.code}`}
                    className="flex h-8 w-8 items-center justify-center border border-border hover:border-primary cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    aria-label={`Delete ${c.code}`}
                    className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>{editingId ? "Edit Coupon" : "Create Coupon"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="cp-code">Coupon Code</Label>
                <Input
                  id="cp-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CRIMSON20"
                  className="mt-1 font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="cp-desc">Description</Label>
                <Input
                  id="cp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-type">Discount Type</Label>
                <Select
                  id="cp-type"
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as DiscountType)
                  }
                  className="mt-1"
                >
                  <option value="PERCENTAGE">PERCENTAGE</option>
                  <option value="FIXED">FIXED</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="cp-val">Value</Label>
                <Input
                  id="cp-val"
                  type="number"
                  step="0.01"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-min">Min Order Amount</Label>
                <Input
                  id="cp-min"
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-max">Max Discount Cap</Label>
                <Input
                  id="cp-max"
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-limit">Global Usage Limit</Label>
                <Input
                  id="cp-limit"
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-per-user">Per-Customer Limit</Label>
                <Input
                  id="cp-per-user"
                  type="number"
                  value={perCustomerLimit}
                  onChange={(e) => setPerCustomerLimit(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-start">Start Date</Label>
                <Input
                  id="cp-start"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cp-end">Expiration Date</Label>
                <Input
                  id="cp-end"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 font-mono text-xs uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" className="flex-1" isLoading={submitting}>
                  {editingId ? "Update Coupon" : "Create Coupon"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
