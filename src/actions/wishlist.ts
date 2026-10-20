"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productCardInclude, toProductCard } from "@/lib/serializers";
import type { ProductCard } from "@/types";

/** Merge local wishlist ids into the DB and return the canonical id list. */
export async function syncWishlist(localIds: unknown): Promise<string[]> {
  const ids = z.array(z.string().uuid()).max(200).safeParse(localIds);
  const local = ids.success ? ids.data : [];
  const user = await getCurrentUser();
  if (!user) return local;

  if (local.length) {
    const valid = await prisma.product.findMany({ where: { id: { in: local } }, select: { id: true } });
    await prisma.wishlist.createMany({
      data: valid.map((p) => ({ userId: user.id, productId: p.id })),
      skipDuplicates: true,
    });
  }
  const rows = await prisma.wishlist.findMany({ where: { userId: user.id }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function toggleWishlist(productId: string, wished: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (wished) {
    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
  } else {
    await prisma.wishlist.deleteMany({ where: { userId: user.id, productId } });
  }
}

export async function getWishlistProducts(ids: string[]): Promise<ProductCard[]> {
  if (!ids.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: productCardInclude,
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  return products.map(toProductCard).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
