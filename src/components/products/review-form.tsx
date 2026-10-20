"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { upsertReview, deleteOwnReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { StarRating } from "@/components/ui/star-rating";
import { ImageUploader } from "@/components/shared/image-uploader";

export function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing?: { rating: number; title: string | null; body: string; images: string[] } | null;
}) {
  const [open, setOpen] = useState(!existing);
  const router = useRouter();
  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId,
      rating: existing?.rating ?? 0,
      title: existing?.title ?? "",
      body: existing?.body ?? "",
      images: existing?.images ?? [],
    },
  });
  const { register, handleSubmit, formState, control } = form;

  async function onSubmit(values: ReviewInput) {
    const res = await upsertReview(values);
    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    } else toast.error(res.error);
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-emerald-50 p-3 text-sm text-emerald-900">
        <span className="flex-1">You reviewed this product.</span>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Edit review
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={async () => {
            const r = await deleteOwnReview(productId);
            if (r.ok) {
              toast.success(r.message);
              router.refresh();
            } else toast.error(r.error);
          }}
        >
          Delete
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border p-4" noValidate>
      <h3 className="font-semibold">{existing ? "Edit your review" : "Write a review"}</h3>
      <FormField label="Your rating" error={formState.errors.rating?.message} required>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <StarRating value={field.value} onChange={field.onChange} size="lg" />}
        />
      </FormField>
      <FormField label="Title (optional)" htmlFor="r-title" error={formState.errors.title?.message}>
        <Input id="r-title" placeholder="Great fit, solid build" {...register("title")} />
      </FormField>
      <FormField label="Review" htmlFor="r-body" error={formState.errors.body?.message} required>
        <Textarea
          id="r-body"
          rows={4}
          placeholder="How does it fit? How is the quality after a few weeks?"
          {...register("body")}
        />
      </FormField>
      <FormField label="Photos (up to 3)">
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader
              folder="reviews"
              value={field.value}
              onChange={field.onChange}
              max={3}
              label="Add photos"
              allowUrl={false}
            />
          )}
        />
      </FormField>
      <div className="flex justify-end gap-2">
        {existing && (
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={formState.isSubmitting}>
          {existing ? "Update review" : "Post review"}
        </Button>
      </div>
    </form>
  );
}
