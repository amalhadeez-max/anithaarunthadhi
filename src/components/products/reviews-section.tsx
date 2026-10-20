import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/actions/reviews";
import { formatDate, initials } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewForm } from "./review-form";

export async function ReviewsSection({
  productId,
  ratingAvg,
  ratingCount,
}: {
  productId: string;
  ratingAvg: number;
  ratingCount: number;
}) {
  const user = await getCurrentUser();
  const [reviews, breakdown, own, purchased] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { fullName: true, avatarUrl: true } }, images: true },
    }),
    prisma.review.groupBy({ by: ["rating"], where: { productId, status: "approved" }, _count: true }),
    user
      ? prisma.review.findUnique({
          where: { productId_userId: { productId, userId: user.id } },
          include: { images: true },
        })
      : null,
    user ? hasPurchased(user.id, productId) : false,
  ]);
  const counts = [5, 4, 3, 2, 1].map((r) => ({ r, n: breakdown.find((b) => b.rating === r)?._count ?? 0 }));

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="space-y-6">
      <h2 id="reviews-heading" className="text-xl font-bold">
        Customer reviews
      </h2>
      <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
        <div className="rounded-xl border p-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black">{ratingAvg.toFixed(1)}</span>
            <span className="pb-1 text-sm text-muted-foreground">/ 5</span>
          </div>
          <StarRating value={ratingAvg} size="md" />
          <p className="mt-1 text-xs text-muted-foreground">
            {ratingCount} review{ratingCount === 1 ? "" : "s"}
          </p>
          <ul className="mt-4 space-y-1.5" aria-label="Rating breakdown">
            {counts.map(({ r, n }) => (
              <li key={r} className="flex items-center gap-2 text-xs">
                <span className="w-6 tabular-nums">{r}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: ratingCount ? `${(n / ratingCount) * 100}%` : 0 }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          {user ? (
            purchased ? (
              <ReviewForm
                productId={productId}
                existing={
                  own
                    ? {
                        rating: own.rating,
                        title: own.title,
                        body: own.body,
                        images: own.images.map((i) => i.url),
                      }
                    : null
                }
              />
            ) : (
              <p className="rounded-lg bg-neutral-50 p-3 text-sm text-muted-foreground">
                Purchased this item? You&apos;ll be able to review it once your order is placed.
              </p>
            )
          ) : (
            <p className="rounded-lg bg-neutral-50 p-3 text-sm text-muted-foreground">
              <Link href={`/login`} className="font-medium underline">
                Sign in
              </Link>{" "}
              to review this product after purchase.
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to share your experience.
            </p>
          ) : (
            <ul className="divide-y">
              {reviews.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={r.user.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="text-xs">{initials(r.user.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.user.fullName ?? "Customer"}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <StarRating value={r.rating} size="xs" /> · {formatDate(r.createdAt)}
                      </div>
                    </div>
                  </div>
                  {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm leading-6 text-neutral-700">{r.body}</p>
                  {r.images.length > 0 && (
                    <ul className="mt-2 flex gap-2">
                      {r.images.map((img) => (
                        <li key={img.id} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                          <Image
                            src={img.url}
                            alt="Review photo"
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
