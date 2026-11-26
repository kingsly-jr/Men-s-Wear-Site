"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Search, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { useStore } from "./store-context";

const RECENT_SEARCHES_KEY = "ct_recent_searches";

interface SuggestionPayload {
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
  }[];
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export function SearchOverlay() {
  const router = useRouter();
  const { isSearchOpen, setIsSearchOpen } = useStore();
  const [query, setQuery] = React.useState("");
  const [recent, setRecent] = React.useState<string[]>([]);
  const [suggestions, setSuggestions] = React.useState<SuggestionPayload>({
    products: [],
    categories: [],
  });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isSearchOpen) return;
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecent(parsed.slice(0, 5));
        }
      }
    } catch {
      // ignore storage read error
    }
  }, [isSearchOpen]);

  React.useEffect(() => {
    if (!isSearchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSearchOpen, setIsSearchOpen]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions({ products: [], categories: [] });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = (await res.json()) as SuggestionPayload;
          setSuggestions(data);
        }
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...recent.filter((r) => r !== clean)].slice(0, 5);
    setRecent(updated);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  };

  const clearRecent = () => {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <AnimatePresence>
      {isSearchOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Search store catalog"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 bg-black/85"
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 border-b border-border bg-card px-4 py-6 sm:px-6"
          >
            <div className="mx-auto max-w-4xl">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search shirts, wool trousers, SKUs, fabrics..."
                    className="h-10 pl-10 pr-10 font-mono text-xs"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search query"
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 border border-primary bg-primary px-5 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-accent cursor-pointer"
                >
                  <span>Search</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Close search overlay"
                  className="inline-flex h-10 w-10 items-center justify-center border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </form>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Recent Searches
                    </span>
                    {recent.length > 0 ? (
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-muted-foreground hover:text-primary cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                        <span>Clear</span>
                      </button>
                    ) : null}
                  </div>
                  {recent.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No recent searches yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recent.map((term) => (
                        <Link
                          key={term}
                          href={`/search?q=${encodeURIComponent(term)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 font-mono text-xs hover:border-primary"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
                          <span>{term}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {loading ? "Searching catalog..." : "Instant Matches"}
                  </p>
                  {suggestions.categories.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {suggestions.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="border border-primary/50 bg-primary/10 px-2.5 py-1 font-mono text-xs uppercase text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {suggestions.products.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border border border-border bg-background">
                      {suggestions.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between px-3 py-2.5 text-xs transition-colors hover:bg-muted"
                        >
                          <span className="font-medium text-foreground">
                            {product.name}
                          </span>
                          <span className="font-mono text-muted-foreground tabular-nums">
                            {formatCurrency(product.price)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : query.trim().length >= 2 && !loading ? (
                    <p className="text-xs text-muted-foreground">
                      No instant matches. Press Search for full catalog scan.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
