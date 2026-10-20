import Link from "next/link";
import type { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { Button } from "@/components/ui/button";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter: ReviewStatus | undefined =
    status === "approved" || status === "hidden" || status === "pending" ? status : undefined;
  const where = statusFilter ? { status: statusFilter } : {};
  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { fullName: true, email: true } },
      product: { select: { name: true, slug: true } },
      images: true,
    },
  });
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Approve, hide or delete customer reviews."
        actions={
          <div className="flex gap-1">
            {[
              ["all", "All"],
              ["approved", "Approved"],
              ["hidden", "Hidden"],
              ["pending", "Pending"],
            ].map(([k, l]) => (
              <Button key={k} asChild size="sm" variant={(status ?? "all") === k ? "default" : "outline"}>
                <Link href={k === "all" ? "/admin/reviews" : `/admin/reviews?status=${k}`}>{l}</Link>
              </Button>
            ))}
          </div>
        }
      />
      <ReviewsTable
        rows={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          user: r.user.fullName ?? r.user.email,
          product: r.product,
          images: r.images.map((i) => i.url),
        }))}
      />
    </>
  );
}
