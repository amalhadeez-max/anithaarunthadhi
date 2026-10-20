"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser, assertAdmin } from "@/lib/auth";
import { reviewSchema, zodMessage } from "@/lib/validations";
import { assertRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/types";
import type { ReviewStatus } from "@prisma/client";

/** Has this user received (or at least paid for) this product? */
export async function hasPurchased(userId: string, productId: string) {
  const n = await prisma.orderItem.count({
    where: {
      productId,
      order: {
        userId,
        OR: [
          { status: "delivered" },
          { paymentStatus: "paid", status: { notIn: ["cancelled", "returned", "pending_payment"] } },
        ],
      },
    },
  });
  return n > 0;
}

export async function upsertReview(input: unknown): Promise<ActionResult> {
  try {
    await assertRateLimit("review", 10, 60 * 60_000);
    const user = await assertUser();
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { productId, rating, title, body, images } = parsed.data;

    if (!(await hasPurchased(user.id, productId)))
      return { ok: false, error: "Only customers who purchased this item can review it." };

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    if (!product) return { ok: false, error: "Product not found" };

    await prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { productId_userId: { productId, userId: user.id } },
        create: { productId, userId: user.id, rating, title: title || null, body, status: "approved" },
        update: { rating, title: title || null, body, status: "approved" },
      });
      await tx.reviewImage.deleteMany({ where: { reviewId: review.id } });
      if (images.length)
        await tx.reviewImage.createMany({ data: images.map((url) => ({ reviewId: review.id, url })) });
    });
    revalidatePath(`/products/${product.slug}`);
    return { ok: true, message: "Thanks! Your review is live." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save review" };
  }
}

export async function deleteOwnReview(productId: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    await prisma.review.deleteMany({ where: { productId, userId: user.id } });
    if (product) revalidatePath(`/products/${product.slug}`);
    return { ok: true, message: "Review deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Admin moderation ──
export async function setReviewStatus(id: string, status: ReviewStatus): Promise<ActionResult> {
  try {
    await assertAdmin();
    const r = await prisma.review.update({
      where: { id },
      data: { status },
      include: { product: { select: { slug: true } } },
    });
    revalidatePath(`/products/${r.product.slug}`);
    revalidatePath("/admin/reviews");
    return { ok: true, message: `Review ${status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function adminDeleteReview(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const r = await prisma.review.delete({ where: { id }, include: { product: { select: { slug: true } } } });
    revalidatePath(`/products/${r.product.slug}`);
    revalidatePath("/admin/reviews");
    return { ok: true, message: "Review deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
