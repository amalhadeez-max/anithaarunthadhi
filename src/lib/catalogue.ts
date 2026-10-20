import "server-only";
import { prisma } from "@/lib/prisma";
import type { BrandCard } from "@/types";

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
