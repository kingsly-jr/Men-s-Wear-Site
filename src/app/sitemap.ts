import type { MetadataRoute } from "next";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/collections`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/search`, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const [products, categories, collections] = await Promise.all([
      prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.collection.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((cat) => ({
        url: `${baseUrl}/categories/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...collections.map((col) => ({
        url: `${baseUrl}/collections/${col.slug}`,
        lastModified: col.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...products.map((prod) => ({
        url: `${baseUrl}/products/${prod.slug}`,
        lastModified: prod.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.9,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
