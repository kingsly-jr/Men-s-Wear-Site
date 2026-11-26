"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit3, FolderTree, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils/slug";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  parent: { id: string; name: string } | null;
  _count: { products: number; children: number };
}

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: AdminCategoryRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = React.useState(initialCategories);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [parentId, setParentId] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setParentId("");
    setSortOrder(0);
    setIsActive(true);
  };

  const loadForEdit = (cat: AdminCategoryRow) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setImageUrl(cat.imageUrl ?? "");
    setParentId(cat.parentId ?? "");
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          description,
          imageUrl,
          parentId: parentId || null,
          sortOrder: Number(sortOrder),
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save failed",
          description: data?.error?.message ?? "Could not save category.",
          variant: "error",
        });
        return;
      }

      const freshRes = await fetch("/api/admin/categories");
      if (freshRes.ok) {
        const freshData = (await freshRes.json()) as {
          categories: AdminCategoryRow[];
        };
        setCategories(freshData.categories);
      }

      toast({
        title: editingId ? "Category updated" : "Category created",
        variant: "success",
      });
      resetForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Delete blocked",
        description:
          data?.error?.message ??
          "Category is still referenced by products or subcategories.",
        variant: "error",
      });
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Category deleted" });
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree
                className="h-4 w-4 text-primary"
                strokeWidth={1.75}
              />
              <span>Categories ({categories.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold uppercase">
                        {cat.parent ? `${cat.parent.name} / ` : ""}
                        {cat.name}
                      </span>
                      <Badge variant={cat.isActive ? "default" : "outline"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      /{cat.slug} &middot; Order {cat.sortOrder} &middot;{" "}
                      {cat._count.products} product(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadForEdit(cat)}
                      aria-label={`Edit ${cat.name}`}
                      className="flex h-8 w-8 items-center justify-center border border-border hover:border-primary cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      aria-label={`Delete ${cat.name}`}
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
              <span>{editingId ? "Edit Category" : "Create Category"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
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
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="cat-parent">Parent Category (Optional)</Label>
                <Select
                  id="cat-parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="mt-1"
                >
                  <option value="">None (Top-Level)</option>
                  {categories
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="cat-img">Image URL (Optional)</Label>
                <Input
                  id="cat-img"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description</Label>
                <Input
                  id="cat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cat-order">Display Order</Label>
                  <Input
                    id="cat-order"
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
                  {editingId ? "Update Category" : "Create Category"}
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
