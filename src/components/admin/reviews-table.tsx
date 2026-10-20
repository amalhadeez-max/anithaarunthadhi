"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, Check } from "lucide-react";
import type { ReviewStatus } from "@prisma/client";
import { setReviewStatus, adminDeleteReview } from "@/actions/reviews";
import { formatDateTime } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "./confirm-button";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  user: string;
  product: { name: string; slug: string };
  images: string[];
};

export function ReviewsTable({ rows }: { rows: ReviewRow[] }) {
  const router = useRouter();
  const act = async (id: string, status: ReviewStatus) => {
    const r = await setReviewStatus(id, status);
    if (r.ok) {
      toast.success(r.message);
      router.refresh();
    } else toast.error(r.error);
  };
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <StarRating value={r.rating} size="sm" />
                <span className="font-medium">{r.user}</span>
                <span className="text-muted-foreground">on</span>
                <Link
                  href={`/products/${r.product.slug}`}
                  className="font-medium hover:underline"
                  target="_blank"
                >
                  {r.product.name}
                </Link>
                <Badge
                  variant={
                    r.status === "approved" ? "success" : r.status === "hidden" ? "secondary" : "warning"
                  }
                  className="capitalize"
                >
                  {r.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
              </div>
              {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm text-neutral-700">{r.body}</p>
              {r.images.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {r.images.map((u) => (
                    <div key={u} className="relative h-14 w-14 overflow-hidden rounded border">
                      <Image src={u} alt="" fill sizes="56px" className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {r.status !== "approved" && (
                <Button size="sm" variant="outline" onClick={() => act(r.id, "approved")}>
                  <Check /> Approve
                </Button>
              )}
              {r.status !== "hidden" && (
                <Button size="sm" variant="outline" onClick={() => act(r.id, "hidden")}>
                  <EyeOff /> Hide
                </Button>
              )}
              {r.status === "hidden" && (
                <Button size="sm" variant="ghost" onClick={() => act(r.id, "approved")}>
                  <Eye /> Show
                </Button>
              )}
              <ConfirmButton
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                title="Delete this review?"
                confirmLabel="Delete"
                action={() => adminDeleteReview(r.id)}
              >
                <Trash2 />
              </ConfirmButton>
            </div>
          </div>
        </li>
      ))}
      {rows.length === 0 && (
        <li className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No reviews yet.
        </li>
      )}
    </ul>
  );
}
