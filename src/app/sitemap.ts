import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  const staticPages: MetadataRoute.Sitemap = ["", "/products", "/about", "/contact"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  try {
    const [products, brands] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.brand.findMany({
        where: { isActive: true, deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return [
      ...staticPages,
      ...brands.map((b) => ({
        url: `${base}/products?brand=${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticPages;
  }
}
