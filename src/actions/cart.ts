"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productCardInclude, toCartLine } from "@/lib/serializers";
import { clampQuantity } from "@/lib/pricing";
import { cartLineSchema } from "@/lib/validations";
import { z } from "zod";
import type { CartLine } from "@/types";

const linesSchema = z.array(cartLineSchema).max(50);

/**
 * Merge the local (guest) cart into the signed-in user's DB cart and return the
 * canonical lines with fresh price/stock. Guests just get refreshed lines back.
 */
export async function syncCart(localItems: unknown): Promise<CartLine[]> {
  const parsed = linesSchema.safeParse(localItems);
  const local = parsed.success ? parsed.data : [];
  const user = await getCurrentUser();

  if (!user) {
    return refreshLines(local);
  }

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
    include: { items: true },
  });

  // Merge: keep the max quantity per product
  const merged = new Map<string, number>();
  for (const it of cart.items) merged.set(it.productId, it.quantity);
  for (const it of local) merged.set(it.productId, Math.max(merged.get(it.productId) ?? 0, it.quantity));

  const ids = [...merged.keys()];
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        include: productCardInclude,
      })
    : [];
  const valid = new Set(products.map((p) => p.id));

  await prisma.$transaction([
    prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: { notIn: ids.filter((i) => valid.has(i)) } },
    }),
    ...products.map((p) =>
      prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: p.id } },
        create: { cartId: cart.id, productId: p.id, quantity: clampQuantity(merged.get(p.id) ?? 1, p.stock) },
        update: { quantity: clampQuantity(merged.get(p.id) ?? 1, p.stock) },
      }),
    ),
  ]);

  return products.map((p) => toCartLine(p, clampQuantity(merged.get(p.id) ?? 1, p.stock)));
}

/** Persist a single line change for signed-in users (no-op for guests). */
export async function setCartLine(productId: string, quantity: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return;
  }
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product) return;
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: clampQuantity(quantity, product.stock) },
    update: { quantity: clampQuantity(quantity, product.stock) },
  });
}

export async function clearServerCart(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
}

async function refreshLines(local: { productId: string; quantity: number }[]): Promise<CartLine[]> {
  if (!local.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: local.map((l) => l.productId) }, isActive: true },
    include: productCardInclude,
  });
  const qty = new Map(local.map((l) => [l.productId, l.quantity]));
  return products.map((p) => toCartLine(p, clampQuantity(qty.get(p.id) ?? 1, p.stock)));
}
