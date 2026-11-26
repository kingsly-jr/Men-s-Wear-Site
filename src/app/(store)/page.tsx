import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { listActiveCategories } from "@/services/category.service";
import { listActiveCollections } from "@/services/collection.service";
import {
  listActivePromotionalBanners,
  getVisibleHomepageSections,
} from "@/services/content.service";
import {
  getBestSellingProducts,
  getRecentlyViewedProducts,
  listCatalogProducts,
} from "@/services/product.service";
import { HeroSection } from "@/components/storefront/hero-section";
import { FeaturedCategories } from "@/components/storefront/featured-categories";
import { ProductRail } from "@/components/storefront/product-rail";
import { FeaturedCollections } from "@/components/storefront/featured-collections";
import { BrandStoryAndBanners } from "@/components/storefront/brand-story";

export const dynamic = "force-dynamic";

export default async function StoreHomePage() {
  const user = await getCurrentUser();

  const [
    sections,
    banners,
    categories,
    collections,
    newArrivalsResult,
    bestSellers,
    featuredResult,
    approvedReviews,
    recentlyViewed,
  ] = await Promise.all([
    getVisibleHomepageSections(),
    listActivePromotionalBanners("HOMEPAGE_MID"),
    listActiveCategories(),
    listActiveCollections(),
    listCatalogProducts({ sort: "newest", page: 1, pageSize: 8 }),
    getBestSellingProducts(8),
    listCatalogProducts({ sort: "featured", page: 1, pageSize: 8 }),
    prisma.productReview.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
    }),
    user ? getRecentlyViewedProducts(user.id, 4) : Promise.resolve([]),
  ]);

  const sectionsByKey = new Map(sections.map((s) => [s.key, s]));
  const heroSection = sectionsByKey.get("HERO") ?? {
    title: "ARCHITECTURAL MENSWEAR. ENGINEERED IN OBSIDIAN.",
    subtitle:
      "Precision-cut silhouettes, heavyweight natural textiles, and monochrome discipline.",
    imageUrl:
      "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1600&q=85",
    ctaLabel: "Shop New Arrivals",
    ctaHref: "/shop?sort=newest",
    secondaryCtaLabel: "Explore Collections",
    secondaryCtaHref: "/collections",
  };

  const catSection = sectionsByKey.get("FEATURED_CATEGORIES");
  const newArrivalsSection = sectionsByKey.get("NEW_ARRIVALS");
  const bestSellersSection = sectionsByKey.get("BEST_SELLERS");
  const collectionsSection = sectionsByKey.get("FEATURED_COLLECTIONS");
  const storySection = sectionsByKey.get("BRAND_STORY") ?? null;

  return (
    <div>
      {sectionsByKey.has("HERO") || sections.length === 0 ? (
        <HeroSection section={heroSection} />
      ) : null}

      {catSection ? (
        <FeaturedCategories
          title={catSection.title}
          subtitle={catSection.subtitle}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            imageUrl: c.imageUrl,
          }))}
        />
      ) : null}

      {newArrivalsSection ? (
        <ProductRail
          title={newArrivalsSection.title}
          subtitle={newArrivalsSection.subtitle}
          href="/shop?sort=newest"
          products={newArrivalsResult.items}
        />
      ) : null}

      {bestSellersSection ? (
        <ProductRail
          title={bestSellersSection.title}
          subtitle={bestSellersSection.subtitle}
          href="/shop?sort=best_selling"
          products={bestSellers}
        />
      ) : null}

      {collectionsSection ? (
        <FeaturedCollections
          title={collectionsSection.title}
          subtitle={collectionsSection.subtitle}
          collections={collections.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            imageUrl: c.imageUrl,
          }))}
        />
      ) : null}

      <ProductRail
        title="TRENDING & FEATURED"
        subtitle="Curated silhouettes selected by the studio."
        href="/shop?sort=featured"
        products={featuredResult.items}
      />

      <BrandStoryAndBanners
        story={
          storySection
            ? {
                title: storySection.title,
                subtitle: storySection.subtitle,
                bodyText: storySection.bodyText,
              }
            : null
        }
        banners={banners}
        testimonials={approvedReviews.map((r) => ({
          id: r.id,
          title: r.title,
          comment: r.comment,
          rating: r.rating,
          authorName: r.user.name,
          productName: r.product.name,
        }))}
      />

      {recentlyViewed.length > 0 ? (
        <ProductRail
          title="RECENTLY VIEWED"
          subtitle="Continue exploring items from your session."
          href="/shop"
          products={recentlyViewed}
        />
      ) : null}
    </div>
  );
}
