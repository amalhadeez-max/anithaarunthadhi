import "server-only";
import { prisma } from "@/lib/prisma";
import type { BrandCard, ProductCard } from "@/types";
import { productCardInclude, toProductCard } from "@/lib/serializers";

export async function getActiveBrands(): Promise<BrandCard[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { segments: true },
  });
  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    segments: b.segments.map((s) => s.segment),
  }));
}

/** Home page: in-stock products, best-reviewed first, then newest. */
export async function getFeaturedProducts(limit = 4): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: [{ ratingCount: "desc" }, { ratingAvg: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: productCardInclude,
  });
  return rows.map(toProductCard);
}

export type Testimonial = { id: string; quote: string; name: string; meta: string; rating: number };

/** Home page: latest approved customer reviews as testimonials. */
export async function getRecentReviews(limit = 6): Promise<Testimonial[]> {
  const rows = await prisma.review.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { fullName: true } }, product: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    quote: r.body,
    name: r.user.fullName ?? "Verified customer",
    meta: `Bought ${r.product.name}`,
    rating: r.rating,
  }));
}
