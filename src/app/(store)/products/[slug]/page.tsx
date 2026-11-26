import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  getProductBySlug,
  getRecentlyViewedProducts,
  recordRecentlyViewed,
} from "@/services/product.service";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import { ProductRail } from "@/components/storefront/product-rail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, user] = await Promise.all([
    getProductBySlug(slug),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  let recentlyViewed: Awaited<ReturnType<typeof getRecentlyViewedProducts>> = [];
  if (user) {
    await recordRecentlyViewed(user.id, product.id);
    recentlyViewed = (await getRecentlyViewedProducts(user.id, 5)).filter(
      (item) => item.id !== product.id
    );
  }

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />

      {product.relatedProducts.length > 0 ? (
        <ProductRail
          title="COMPLEMENTARY PIECES"
          subtitle={`More from ${product.category.name}`}
          href={`/categories/${product.category.slug}`}
          products={product.relatedProducts}
        />
      ) : null}

      {recentlyViewed.length > 0 ? (
        <ProductRail
          title="RECENTLY VIEWED"
          subtitle="Items from your recent browsing history."
          href="/shop"
          products={recentlyViewed.slice(0, 4)}
        />
      ) : null}
    </div>
  );
}
