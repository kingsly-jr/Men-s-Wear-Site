"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils/cn";
import { useStore } from "./store-context";

export interface NavCategoryItem {
  id: string;
  name: string;
  slug: string;
}

export interface NavCollectionItem {
  id: string;
  name: string;
  slug: string;
}

export function SiteHeader({
  brandName,
  categories,
  collections,
}: {
  brandName: string;
  categories: NavCategoryItem[];
  collections: NavCollectionItem[];
}) {
  const pathname = usePathname();
  const {
    user,
    cart,
    wishlistIds,
    setIsCartOpen,
    setIsSearchOpen,
  } = useStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<
    "categories" | "collections" | null
  >(null);

  React.useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const navLinkClass = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1 border-b-2 py-1 font-mono text-xs uppercase tracking-wider transition-colors",
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    );

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Trigger + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary lg:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2.5 font-mono text-sm font-bold uppercase tracking-[0.18em] text-foreground sm:text-base"
          >
            <span className="inline-block h-3.5 w-3.5 bg-primary" />
            <span>{brandName}</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          <Link href="/" className={navLinkClass(pathname === "/")}>
            Home
          </Link>
          <Link
            href="/shop?sort=newest"
            className={navLinkClass(pathname === "/shop")}
          >
            New Arrivals
          </Link>
          <Link href="/shop" className={navLinkClass(pathname === "/shop")}>
            Shop
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("categories")}
          >
            <button
              type="button"
              onClick={() =>
                setActiveDropdown((prev) =>
                  prev === "categories" ? null : "categories"
                )
              }
              className={cn(
                navLinkClass(pathname.startsWith("/categories")),
                "cursor-pointer"
              )}
            >
              <span>Categories</span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("collections")}
          >
            <button
              type="button"
              onClick={() =>
                setActiveDropdown((prev) =>
                  prev === "collections" ? null : "collections"
                )
              }
              className={cn(
                navLinkClass(pathname.startsWith("/collections")),
                "cursor-pointer"
              )}
            >
              <span>Collections</span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <Link
            href="/shop?discounted=true"
            className="inline-flex items-center border border-primary/60 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Offers
          </Link>
        </nav>

        {/* Right: Utility Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search overlay"
            className="inline-flex h-10 w-10 items-center justify-center border border-transparent text-foreground transition-colors hover:border-border cursor-pointer"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative inline-flex h-10 w-10 items-center justify-center border border-transparent text-foreground transition-colors hover:border-border"
          >
            <Heart className="h-4 w-4" strokeWidth={1.75} />
            {wishlistIds.size > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">
                {wishlistIds.size}
              </span>
            ) : null}
          </Link>

          <Link
            href={user ? "/account" : "/auth/login"}
            aria-label={user ? "Customer account" : "Sign in"}
            className="inline-flex h-10 items-center gap-2 border border-transparent px-2.5 text-foreground transition-colors hover:border-border"
          >
            <User className="h-4 w-4" strokeWidth={1.75} />
            {user ? (
              <span className="hidden font-mono text-xs uppercase tracking-wider sm:inline">
                {user.name.split(" ")[0]}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open shopping bag"
            className="relative inline-flex h-10 items-center gap-2 border border-border bg-card px-3 text-foreground transition-colors hover:border-primary cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span className="font-mono text-xs font-semibold tabular-nums">
              {cart.itemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Mega-Dropdown */}
      <AnimatePresence>
        {activeDropdown ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="hidden border-t border-border bg-card lg:block"
          >
            <div className="mx-auto max-w-7xl px-6 py-6">
              {activeDropdown === "categories" ? (
                <div>
                  <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Shop by Category
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="border border-border bg-background px-4 py-3 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Curated Collections
                  </p>
                  <div className="grid grid-cols-5 gap-3">
                    {collections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.slug}`}
                        className="border border-border bg-background px-4 py-3 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {col.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="left"
        title={brandName}
      >
        <nav className="flex flex-col gap-5" aria-label="Mobile navigation">
          <div className="flex flex-col gap-2 border-b border-border pb-4">
            <Link
              href="/"
              className="py-1.5 font-mono text-sm uppercase tracking-wider hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/shop?sort=newest"
              className="py-1.5 font-mono text-sm uppercase tracking-wider hover:text-primary"
            >
              New Arrivals
            </Link>
            <Link
              href="/shop"
              className="py-1.5 font-mono text-sm uppercase tracking-wider hover:text-primary"
            >
              Shop All
            </Link>
            <Link
              href="/shop?discounted=true"
              className="py-1.5 font-mono text-sm uppercase tracking-wider text-primary"
            >
              Offers &amp; Markdowns
            </Link>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="border border-border px-3 py-2 font-mono text-xs uppercase tracking-wider hover:border-primary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Collections
            </p>
            <div className="flex flex-col gap-2">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="border border-border px-3 py-2 font-mono text-xs uppercase tracking-wider hover:border-primary"
                >
                  {col.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </Drawer>
    </header>
  );
}
