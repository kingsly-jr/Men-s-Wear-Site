"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { StoreSettingsDTO } from "@/services/settings.service";
import type { NavCategoryItem, NavCollectionItem } from "./site-header";

export function SiteFooter({
  settings,
  categories,
  collections,
}: {
  settings: StoreSettingsDTO;
  categories: NavCategoryItem[];
  collections: NavCollectionItem[];
}) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Subscription failed",
          description: data?.error?.message ?? "Enter a valid email address.",
          variant: "error",
        });
        return;
      }
      setEmail("");
      toast({
        title: "Subscribed to dispatch",
        description: "You will receive seasonal releases and private offers.",
        variant: "success",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12">
        {/* Brand + Newsletter */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2.5 font-mono text-sm font-bold uppercase tracking-[0.18em]">
            <span className="inline-block h-3 w-3 bg-primary" />
            <span>{settings.brandName}</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Architectural menswear flagship engineered in obsidian, heavyweight
            cotton, and tailored wool blends.
          </p>

          <form onSubmit={handleSubscribe} className="mt-6 max-w-md">
            <label
              htmlFor="footer-newsletter"
              className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
            >
              Private Dispatch &amp; Drop Alerts
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="footer-newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1"
              />
              <Button type="submit" isLoading={submitting}>
                <span>Join</span>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            </div>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <span>{settings.storeAddress}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <span>{settings.contactEmail}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <span>{settings.contactPhone}</span>
            </p>
          </div>
        </div>

        {/* Departments */}
        <div className="lg:col-span-3">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Departments
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground lg:grid-cols-1">
            {categories.slice(0, 8).map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Collections */}
        <div className="lg:col-span-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Collections
          </h3>
          <ul className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            {collections.map((col) => (
              <li key={col.id}>
                <Link
                  href={`/collections/${col.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {col.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Client Services */}
        <div className="lg:col-span-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Client Services
          </h3>
          <ul className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            <li>
              <Link href="/account" className="hover:text-primary">
                Account Overview
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-primary">
                Order Tracking
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-primary">
                Saved Wishlist
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-primary">
                Shopping Bag
              </Link>
            </li>
            <li>
              <Link href="/shop?discounted=true" className="hover:text-primary">
                Seasonal Offers
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:flex-row sm:items-center">
          <span>
            &copy; {new Date().getFullYear()} {settings.brandName}. All rights
            reserved.
          </span>
          <span>
            Returns accepted within {settings.returnWindowDays} days of delivery
          </span>
        </div>
      </div>
    </footer>
  );
}
