import type { Prisma } from "@prisma/client";
import type { ProductCard, CartLine } from "@/types";
import { toNumber } from "@/lib/utils";

export const productCardInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.ProductInclude;

type ProductWithCard = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function toProductCard(p: ProductWithCard): ProductCard {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: toNumber(p.price),
    discountPrice: p.discountPrice ? toNumber(p.discountPrice) : null,
    stock: p.stock,
    ratingAvg: toNumber(p.ratingAvg),
    ratingCount: p.ratingCount,
    imageUrl: p.images[0]?.url ?? null,
    brandName: p.brand.name,
    brandSlug: p.brand.slug,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toCartLine(p: ProductWithCard, quantity: number): CartLine {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    price: toNumber(p.price),
    discountPrice: p.discountPrice ? toNumber(p.discountPrice) : null,
    stock: p.stock,
    quantity,
  };
}
