"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import { resolveEffectivePrice } from "@/lib/utils/pricing";
import { cn } from "@/lib/utils/cn";
import { useStore } from "@/components/layout/store-context";
import { ProductGallery } from "./product-gallery";

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  fabric: string | null;
  material: string | null;
  careInstructions: string | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  category: {
    id: string;
    name: string;
    slug: string;
    parent: { id: string; name: string; slug: string } | null;
  };
  images: { id: string; url: string; altText: string | null }[];
  specifications: { id: string; specKey: string; specValue: string }[];
  variants: {
    id: string;
    sku: string;
    stock: number;
    priceOverride: number | null;
    size: { id: string; name: string; code: string };
    color: { id: string; name: string; hexCode: string };
  }[];
  reviews: {
    id: string;
    rating: number;
    title: string;
    comment: string;
    isVerifiedPurchase: boolean;
    createdAt: Date | string;
    user: { name: string };
  }[];
}

export function ProductDetailClient({
  product,
}: {
  product: ProductDetailData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, wishlistIds, toggleWishlist, addToCart, isMutatingCart } =
    useStore();

  const uniqueColors = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; hexCode: string }>();
    for (const v of product.variants) map.set(v.color.id, v.color);
    return Array.from(map.values());
  }, [product.variants]);

  const uniqueSizes = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const v of product.variants) map.set(v.size.id, v.size);
    return Array.from(map.values());
  }, [product.variants]);

  const initialVariant =
    product.variants.find((v) => v.stock > 0) ?? product.variants[0];

  const [selectedColorId, setSelectedColorId] = React.useState(
    initialVariant?.color.id ?? ""
  );
  const [selectedSizeId, setSelectedSizeId] = React.useState(
    initialVariant?.size.id ?? ""
  );
  const [quantity, setQuantity] = React.useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = React.useState(false);

  // Postal code check
  const [postalCode, setPostalCode] = React.useState("");
  const [postalResult, setPostalResult] = React.useState<{
    serviceable: boolean;
    estimatedDays: string;
    codAvailable: boolean;
  } | null>(null);
  const [checkingPostal, setCheckingPostal] = React.useState(false);

  // Review state
  const [reviews, setReviews] = React.useState(product.reviews);
  const [rating, setRating] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState("");
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const activeVariant = product.variants.find(
    (v) => v.color.id === selectedColorId && v.size.id === selectedSizeId
  );

  React.useEffect(() => {
    if (activeVariant && quantity > activeVariant.stock) {
      setQuantity(Math.max(1, activeVariant.stock));
    }
  }, [activeVariant, quantity]);

  const effectivePrice = resolveEffectivePrice(
    product.price,
    activeVariant?.priceOverride ?? null
  );

  const isSaved = wishlistIds.has(product.id);

  const handlePostalCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim()) return;
    setCheckingPostal(true);
    try {
      const res = await fetch(
        `/api/postal-check?code=${encodeURIComponent(postalCode.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Invalid postal code",
          description: data?.error?.message ?? "Enter a valid postal code.",
          variant: "error",
        });
        setPostalResult(null);
        return;
      }
      setPostalResult(data);
    } finally {
      setCheckingPostal(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?next=/products/${product.slug}`);
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Review error",
          description: data?.error?.message ?? "Could not submit review.",
          variant: "error",
        });
        return;
      }

      setReviews((prev) => [
        {
          id: data.review.id,
          rating: data.review.rating,
          title: data.review.title,
          comment: data.review.comment,
          isVerifiedPurchase: data.review.isVerifiedPurchase,
          createdAt: data.review.createdAt,
          user: { name: user.name },
        },
        ...prev.filter((r) => r.user.name !== user.name),
      ]);
      setReviewTitle("");
      setReviewComment("");
      toast({ title: "Review published", variant: "success" });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        {product.category.parent ? (
          <>
            <Link
              href={`/categories/${product.category.parent.slug}`}
              className="hover:text-foreground"
            >
              {product.category.parent.name}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <Link
          href={`/categories/${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main Split */}
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery productName={product.name} images={product.images} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="border-b border-border pb-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{product.category.name}</Badge>
              {product.discountPercent > 0 ? (
                <Badge variant="default">-{product.discountPercent}% OFF</Badge>
              ) : null}
            </div>

            <h1 className="font-mono text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">
              SKU: {activeVariant?.sku ?? product.sku}
            </p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                {formatCurrency(effectivePrice)}
              </span>
              {product.originalPrice &&
              product.originalPrice > effectivePrice ? (
                <span className="font-mono text-sm text-muted-foreground line-through tabular-nums">
                  {formatCurrency(product.originalPrice)}
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Color:{" "}
              <span className="text-foreground">
                {uniqueColors.find((c) => c.id === selectedColorId)?.name}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {uniqueColors.map((color) => {
                const active = color.id === selectedColorId;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColorId(color.id)}
                    className={cn(
                      "inline-flex items-center gap-2 border px-3 py-2 font-mono text-xs uppercase transition-colors cursor-pointer",
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className="h-3.5 w-3.5 border border-border"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Size:{" "}
                <span className="text-foreground">
                  {uniqueSizes.find((s) => s.id === selectedSizeId)?.name}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-primary hover:underline cursor-pointer"
              >
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Size Guide</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {uniqueSizes.map((size) => {
                const matchingVariant = product.variants.find(
                  (v) =>
                    v.color.id === selectedColorId && v.size.id === size.id
                );
                const available = Boolean(
                  matchingVariant && matchingVariant.stock > 0
                );
                const active = size.id === selectedSizeId;
                return (
                  <button
                    key={size.id}
                    type="button"
                    disabled={!matchingVariant}
                    onClick={() => setSelectedSizeId(size.id)}
                    className={cn(
                      "border py-2.5 font-mono text-xs uppercase transition-colors cursor-pointer disabled:opacity-35",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : available
                        ? "border-border bg-card text-foreground hover:border-primary"
                        : "border-border bg-background text-muted-foreground line-through"
                    )}
                  >
                    {size.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock & Quantity */}
          <div className="flex items-center justify-between border border-border bg-card p-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider">
                {activeVariant && activeVariant.stock > 0 ? (
                  <span className="text-foreground">
                    In Stock ({activeVariant.stock} available)
                  </span>
                ) : (
                  <span className="text-primary">
                    Unavailable in this combination
                  </span>
                )}
              </p>
            </div>

            <div className="inline-flex items-center border border-border bg-background">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <span className="w-10 text-center font-mono text-xs font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                disabled={!activeVariant || quantity >= activeVariant.stock}
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(activeVariant?.stock ?? 1, q + 1)
                  )
                }
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button
                variant="primary"
                size="lg"
                disabled={!activeVariant || activeVariant.stock <= 0}
                isLoading={isMutatingCart}
                onClick={async () => {
                  if (!activeVariant) return;
                  await addToCart(activeVariant.id, quantity, true);
                }}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                <span>Add to Bag</span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                disabled={!activeVariant || activeVariant.stock <= 0}
                isLoading={isMutatingCart}
                onClick={async () => {
                  if (!activeVariant) return;
                  const ok = await addToCart(activeVariant.id, quantity, false);
                  if (ok) {
                    router.push("/checkout");
                  }
                }}
              >
                <Zap className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <span>Buy Now</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isSaved ? "fill-primary text-primary" : ""
                )}
                strokeWidth={1.75}
              />
              <span>
                {isSaved ? "Saved in Wishlist" : "Add to Wishlist"}
              </span>
            </Button>
          </div>

          {/* Postal Availability */}
          <div className="border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
              <Truck className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <span>Delivery &amp; Dispatch Availability</span>
            </p>
            <form onSubmit={handlePostalCheck} className="flex gap-2">
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Enter PIN / Postal Code (e.g. 400001)"
              />
              <Button
                type="submit"
                variant="secondary"
                isLoading={checkingPostal}
              >
                Check
              </Button>
            </form>
            {postalResult ? (
              <p className="mt-2.5 flex items-center gap-2 text-xs text-foreground">
                <CheckCircle2
                  className="h-4 w-4 text-primary"
                  strokeWidth={1.75}
                />
                <span>
                  Estimated delivery in{" "}
                  <strong>{postalResult.estimatedDays}</strong>. Cash on
                  delivery available.
                </span>
              </p>
            ) : null}
          </div>

          {/* Specifications, Fabric & Care */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider">
                Garment Specifications
              </h2>
            </div>
            <div className="divide-y divide-border text-xs">
              {product.fabric ? (
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <span className="font-mono uppercase text-muted-foreground">
                    Fabric
                  </span>
                  <span className="text-right text-foreground">
                    {product.fabric}
                  </span>
                </div>
              ) : null}
              {product.material ? (
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <span className="font-mono uppercase text-muted-foreground">
                    Weave / Material
                  </span>
                  <span className="text-right text-foreground">
                    {product.material}
                  </span>
                </div>
              ) : null}
              {product.careInstructions ? (
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <span className="font-mono uppercase text-muted-foreground">
                    Care
                  </span>
                  <span className="text-right text-foreground">
                    {product.careInstructions}
                  </span>
                </div>
              ) : null}
              {product.specifications.map((spec) => (
                <div
                  key={spec.id}
                  className="flex justify-between gap-4 px-4 py-2.5"
                >
                  <span className="font-mono uppercase text-muted-foreground">
                    {spec.specKey}
                  </span>
                  <span className="text-right text-foreground">
                    {spec.specValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-16 border-t border-border pt-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-mono text-xl font-bold uppercase tracking-wider">
              Customer Reviews ({reviews.length})
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Verified fit and fabric feedback from Crimson Terminal patrons.
            </p>

            <form
              onSubmit={handleReviewSubmit}
              className="mt-6 flex flex-col gap-4 border border-border bg-card p-5"
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider">
                Write a Review
              </p>

              <div>
                <p className="mb-1.5 font-mono text-[11px] uppercase text-muted-foreground">
                  Rating
                </p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      aria-label={`Rate ${num} stars`}
                      className="border border-border p-2 hover:border-primary cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          num <= rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        )}
                        strokeWidth={1.75}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Input
                required
                placeholder="Headline (e.g. Crisp drape and heavyweight feel)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
              <Textarea
                required
                placeholder="Share your thoughts on fit, sizing, and fabric quality..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <Button type="submit" isLoading={submittingReview}>
                {user ? "Submit Review" : "Sign In to Review"}
              </Button>
            </form>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-7">
            {reviews.length === 0 ? (
              <div className="border border-border bg-card p-8 text-center text-xs text-muted-foreground">
                No reviews yet. Be the first patron to review this garment.
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          )}
                          strokeWidth={1.75}
                        />
                      ))}
                    </div>
                    {review.isVerifiedPurchase ? (
                      <Badge variant="outline">Verified Buyer</Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider">
                    {review.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase text-muted-foreground">
                    {review.user.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Size Guide Modal */}
      <Modal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        title="Crimson Terminal Size Matrix"
        description="Measurements in inches across standard tailored cuts."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border font-mono text-xs">
            <thead>
              <tr className="border-b border-border bg-muted text-left uppercase">
                <th className="p-2.5">Size</th>
                <th className="p-2.5">Chest</th>
                <th className="p-2.5">Shoulder</th>
                <th className="p-2.5">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-2.5 font-semibold">S (36)</td>
                <td className="p-2.5">38&quot;</td>
                <td className="p-2.5">17.5&quot;</td>
                <td className="p-2.5">27.5&quot;</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">M (38)</td>
                <td className="p-2.5">40&quot;</td>
                <td className="p-2.5">18.2&quot;</td>
                <td className="p-2.5">28.5&quot;</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">L (40)</td>
                <td className="p-2.5">42.5&quot;</td>
                <td className="p-2.5">19.0&quot;</td>
                <td className="p-2.5">29.5&quot;</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">XL (42)</td>
                <td className="p-2.5">45&quot;</td>
                <td className="p-2.5">19.8&quot;</td>
                <td className="p-2.5">30.5&quot;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
