"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

export interface HomepageSectionItem {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  bodyText: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export interface PromotionalBannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  placement: string;
  sortOrder: number;
  isActive: boolean;
}

export function ContentManager({
  initialSections,
  initialBanners,
}: {
  initialSections: HomepageSectionItem[];
  initialBanners: PromotionalBannerItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sections, setSections] = React.useState(initialSections);
  const [banners, setBanners] = React.useState(initialBanners);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  // New Banner State
  const [bTitle, setBTitle] = React.useState("");
  const [bSubtitle, setBSubtitle] = React.useState("");
  const [bCtaLabel, setBCtaLabel] = React.useState("");
  const [bCtaHref, setBCtaHref] = React.useState("/shop?discounted=true");
  const [bCreating, setBCreating] = React.useState(false);

  const updateSectionField = <K extends keyof HomepageSectionItem>(
    key: string,
    field: K,
    value: HomepageSectionItem[K]
  ) => {
    setSections((prev) =>
      prev.map((sec) => (sec.key === key ? { ...sec, [field]: value } : sec))
    );
  };

  const handleSaveSection = async (sec: HomepageSectionItem) => {
    setSavingKey(sec.key);
    try {
      const res = await fetch(`/api/admin/content/sections/${sec.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sec.title,
          subtitle: sec.subtitle,
          bodyText: sec.bodyText,
          imageUrl: sec.imageUrl ?? "",
          ctaLabel: sec.ctaLabel,
          ctaHref: sec.ctaHref,
          secondaryCtaLabel: sec.secondaryCtaLabel,
          secondaryCtaHref: sec.secondaryCtaHref,
          sortOrder: Number(sec.sortOrder),
          isVisible: sec.isVisible,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save failed",
          description: data?.error?.message ?? "Check section fields.",
          variant: "error",
        });
        return;
      }
      toast({ title: `Saved ${sec.key} section`, variant: "success" });
      router.refresh();
    } finally {
      setSavingKey(null);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBCreating(true);
    try {
      const res = await fetch("/api/admin/content/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bTitle,
          subtitle: bSubtitle,
          ctaLabel: bCtaLabel,
          ctaHref: bCtaHref,
          placement: "HOMEPAGE_MID",
          sortOrder: banners.length,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed to create banner",
          description: data?.error?.message ?? "Invalid banner fields.",
          variant: "error",
        });
        return;
      }
      setBanners((prev) => [...prev, data.banner]);
      setBTitle("");
      setBSubtitle("");
      setBCtaLabel("");
      toast({ title: "Promotional banner added", variant: "success" });
      router.refresh();
    } finally {
      setBCreating(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const res = await fetch(`/api/admin/content/banners/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Banner removed" });
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Homepage Content Management
        </h1>
        <p className="text-xs text-muted-foreground">
          Control hero copy, editorial sections, visibility toggles, and
          promotional banners shown on the storefront.
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {sections.map((sec) => (
          <Card key={sec.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate
                  className="h-4 w-4 text-primary"
                  strokeWidth={1.75}
                />
                <span>Section: {sec.key}</span>
              </CardTitle>
              <Badge variant={sec.isVisible ? "default" : "outline"}>
                {sec.isVisible ? "Visible" : "Hidden"}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input
                  value={sec.title}
                  onChange={(e) =>
                    updateSectionField(sec.key, "title", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={sec.subtitle ?? ""}
                  onChange={(e) =>
                    updateSectionField(sec.key, "subtitle", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              {sec.key === "HERO" ? (
                <>
                  <div className="sm:col-span-2">
                    <Label>Hero Campaign Image URL</Label>
                    <Input
                      value={sec.imageUrl ?? ""}
                      onChange={(e) =>
                        updateSectionField(sec.key, "imageUrl", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Primary CTA Label</Label>
                    <Input
                      value={sec.ctaLabel ?? ""}
                      onChange={(e) =>
                        updateSectionField(sec.key, "ctaLabel", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Primary CTA Link</Label>
                    <Input
                      value={sec.ctaHref ?? ""}
                      onChange={(e) =>
                        updateSectionField(sec.key, "ctaHref", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </>
              ) : null}

              {sec.key === "BRAND_STORY" ? (
                <div className="sm:col-span-2">
                  <Label>Editorial Story Body</Label>
                  <Textarea
                    value={sec.bodyText ?? ""}
                    onChange={(e) =>
                      updateSectionField(sec.key, "bodyText", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-6 sm:col-span-2">
                <div className="w-28">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={sec.sortOrder}
                    onChange={(e) =>
                      updateSectionField(
                        sec.key,
                        "sortOrder",
                        Number(e.target.value)
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <label className="mt-5 flex items-center gap-2 font-mono text-xs uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sec.isVisible}
                    onChange={(e) =>
                      updateSectionField(sec.key, "isVisible", e.target.checked)
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Visible on Homepage</span>
                </label>

                <div className="ml-auto mt-5">
                  <Button
                    size="sm"
                    isLoading={savingKey === sec.key}
                    onClick={() => handleSaveSection(sec)}
                  >
                    <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Save Section</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotional Banners */}
      <Card>
        <CardHeader>
          <CardTitle>Promotional Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {banners.length > 0 ? (
            <div className="divide-y divide-border border border-border">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 bg-background p-3.5 text-xs"
                >
                  <div>
                    <p className="font-mono font-semibold uppercase">
                      {b.title}
                    </p>
                    <p className="text-muted-foreground">
                      {b.subtitle} &middot; {b.ctaLabel} ({b.ctaHref})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(b.id)}
                    aria-label={`Delete banner ${b.title}`}
                    className="text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={handleCreateBanner}
            className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="bn-title">Banner Headline</Label>
              <Input
                id="bn-title"
                required
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                placeholder="SEASONAL ARCHIVE // UP TO 25% OFF"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bn-sub">Subtitle</Label>
              <Input
                id="bn-sub"
                value={bSubtitle}
                onChange={(e) => setBSubtitle(e.target.value)}
                placeholder="Use code CRIMSON15 on qualifying orders."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bn-cta">CTA Label</Label>
              <Input
                id="bn-cta"
                value={bCtaLabel}
                onChange={(e) => setBCtaLabel(e.target.value)}
                placeholder="Shop Offers"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bn-href">CTA Destination</Label>
              <Input
                id="bn-href"
                value={bCtaHref}
                onChange={(e) => setBCtaHref(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={bCreating}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                <span>Add Promotional Banner</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
