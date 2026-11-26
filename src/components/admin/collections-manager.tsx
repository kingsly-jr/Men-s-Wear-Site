"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit3, Layers, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils/slug";

export interface AdminCollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  products: { productId: string; sortOrder: number }[];
  _count: { products: number };
}

export function CollectionsManager({
  initialCollections,
  allProducts,
}: {
  initialCollections: AdminCollectionRow[];
  allProducts: { id: string; name: string; sku: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [collections, setCollections] = React.useState(initialCollections);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>(
    []
  );
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setSortOrder(0);
    setIsActive(true);
    setSelectedProductIds([]);
  };

  const loadForEdit = (col: AdminCollectionRow) => {
    setEditingId(col.id);
    setName(col.name);
    setSlug(col.slug);
    setDescription(col.description ?? "");
    setImageUrl(col.imageUrl ?? "");
    setSortOrder(col.sortOrder);
    setIsActive(col.isActive);
    setSelectedProductIds(col.products.map((p) => p.productId));
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingId
        ? `/api/admin/collections/${editingId}`
        : "/api/admin/collections";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          description,
          imageUrl,
          sortOrder: Number(sortOrder),
          isActive,
          productIds: selectedProductIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save failed",
          description: data?.error?.message ?? "Could not save collection.",
          variant: "error",
        });
        return;
      }

      const freshRes = await fetch("/api/admin/collections");
      if (freshRes.ok) {
        const freshData = (await freshRes.json()) as {
          collections: AdminCollectionRow[];
        };
        setCollections(freshData.collections);
      }

      toast({
        title: editingId ? "Collection updated" : "Collection created",
        variant: "success",
      });
      resetForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/collections/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Collection deleted" });
      router.refresh();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Collections ({collections.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold uppercase">
                        {col.name}
                      </span>
                      <Badge variant={col.isActive ? "default" : "outline"}>
                        {col.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      /{col.slug} &middot; {col._count.products} product(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadForEdit(col)}
                      aria-label={`Edit ${col.name}`}
                      className="flex h-8 w-8 items-center justify-center border border-border hover:border-primary cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(col.id)}
                      aria-label={`Delete ${col.name}`}
                      className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>{editingId ? "Edit Collection" : "Create Collection"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="col-name">Name</Label>
                <Input
                  id="col-name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) setSlug(slugify(e.target.value));
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="col-slug">Slug</Label>
                <Input
                  id="col-slug"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="col-img">Image URL</Label>
                <Input
                  id="col-img"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="col-desc">Description</Label>
                <Input
                  id="col-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Assign Products ({selectedProductIds.length})</Label>
                <div className="mt-1.5 max-h-44 overflow-y-auto border border-border bg-background p-2">
                  {allProducts.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 py-1 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span>
                        {p.name}{" "}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ({p.sku})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="col-order">Display Order</Label>
                  <Input
                    id="col-order"
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end pb-2">
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
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" isLoading={submitting}>
                  {editingId ? "Update Collection" : "Create Collection"}
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
