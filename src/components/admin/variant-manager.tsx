"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import type { Segment, VehicleType } from "@prisma/client";
import {
  vehicleModelSchema,
  bulkVariantSchema,
  type VehicleModelInput,
  type BulkVariantInput,
} from "@/lib/validations";
import {
  upsertModel,
  deleteModel,
  bulkAddVariants,
  deleteVariant,
  deleteVariantsForModel,
} from "@/actions/variants";
import { SEGMENTS, VEHICLE_TYPES_BY_SEGMENT, VEHICLE_TYPE_LABEL, YEAR_MAX } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmButton } from "./confirm-button";
import { ImageUploader } from "@/components/shared/image-uploader";
import { cn } from "@/lib/utils";

export type ModelRow = {
  id: string;
  name: string;
  slug: string;
  segment: Segment;
  imageUrl: string | null;
  isActive: boolean;
  variants: { id: string; year: number; vehicleType: VehicleType }[];
  compatCount: number;
};

export function ModelFormDialog({
  brandId,
  segments,
  model,
}: {
  brandId: string;
  segments: Segment[];
  model?: ModelRow;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<VehicleModelInput>({
    resolver: zodResolver(vehicleModelSchema),
    defaultValues: model
      ? {
          brandId,
          id: model.id,
          name: model.name,
          slug: model.slug,
          segment: model.segment,
          imageUrl: model.imageUrl ?? "",
          isActive: model.isActive,
        }
      : { brandId, name: "", segment: segments[0], imageUrl: "", isActive: true },
  });
  const { register, handleSubmit, formState, control } = form;
  async function onSubmit(values: VehicleModelInput) {
    const res = await upsertModel(values);
    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {model ? (
          <Button variant="ghost" size="icon-sm" aria-label="Edit model">
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Add model
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{model ? `Edit ${model.name}` : "Add model"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Model name" htmlFor="m-name" error={formState.errors.name?.message} required>
            <Input id="m-name" placeholder="Splendor Plus" {...register("name")} />
          </FormField>
          <FormField label="Segment" error={formState.errors.segment?.message} required>
            <Controller
              control={control}
              name="segment"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SEGMENTS.find((x) => x.value === s)?.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Miniature image (optional)">
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUploader
                  folder="models"
                  value={field.value ? [field.value] : []}
                  onChange={(u) => field.onChange(u[0] ?? "")}
                  max={1}
                  label="Upload image"
                />
              )}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formState.isSubmitting}>
              {model ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkYearsForm({ model }: { model: ModelRow }) {
  const router = useRouter();
  const types = VEHICLE_TYPES_BY_SEGMENT[model.segment];
  const form = useForm<BulkVariantInput>({
    resolver: zodResolver(bulkVariantSchema),
    defaultValues: {
      modelId: model.id,
      yearFrom: YEAR_MAX - 7,
      yearTo: YEAR_MAX,
      vehicleType: model.variants[0]?.vehicleType ?? types[0],
    },
  });
  const { register, handleSubmit, formState, control } = form;
  async function onSubmit(values: BulkVariantInput) {
    const res = await bulkAddVariants(values);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-2 rounded-lg bg-neutral-50 p-3"
      noValidate
    >
      <FormField
        label="From year"
        htmlFor={`from-${model.id}`}
        error={formState.errors.yearFrom?.message}
        className="w-24"
      >
        <Input id={`from-${model.id}`} type="number" className="h-9" {...register("yearFrom")} />
      </FormField>
      <FormField
        label="To year"
        htmlFor={`to-${model.id}`}
        error={formState.errors.yearTo?.message}
        className="w-24"
      >
        <Input id={`to-${model.id}`} type="number" className="h-9" {...register("yearTo")} />
      </FormField>
      <FormField label="Vehicle type" className="w-40" error={formState.errors.vehicleType?.message}>
        <Controller
          control={control}
          name="vehicleType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {VEHICLE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <Button type="submit" size="sm" className="h-9" loading={formState.isSubmitting}>
        <Plus /> Add years
      </Button>
    </form>
  );
}

export function ModelCard({
  model,
  brandId,
  segments,
}: {
  model: ModelRow;
  brandId: string;
  segments: Segment[];
}) {
  const [open, setOpen] = useState(model.variants.length < 12);
  const router = useRouter();
  const byType = model.variants.reduce<Record<string, ModelRow["variants"]>>((acc, v) => {
    (acc[v.vehicleType] ??= []).push(v);
    return acc;
  }, {});
  return (
    <div className="rounded-xl border bg-white">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? (
            <ChevronUp className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          )}
          <span className="font-semibold">{model.name}</span>
          <Badge variant="secondary">{SEGMENTS.find((s) => s.value === model.segment)?.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {model.variants.length} variants · {model.compatCount} product links
          </span>
        </button>
        <ModelFormDialog brandId={brandId} segments={segments} model={model} />
        <ConfirmButton
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          aria-label="Delete model"
          title={`Delete ${model.name}?`}
          description={
            model.compatCount > 0
              ? `Blocked: ${model.compatCount} product compatibility rows reference this model's variants.`
              : "All its variants will be deleted too."
          }
          confirmLabel="Delete"
          action={() => deleteModel(model.id)}
        >
          <Trash2 />
        </ConfirmButton>
      </div>
      {open && (
        <div className="space-y-3 border-t p-3">
          <BulkYearsForm model={model} />
          {Object.keys(byType).length === 0 && (
            <p className="text-sm text-muted-foreground">No variants yet — add a year range above.</p>
          )}
          {Object.entries(byType).map(([type, list]) => (
            <div key={type}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-medium">{VEHICLE_TYPE_LABEL[type as VehicleType]}</span>
                <span className="text-xs text-muted-foreground">{list.length} years</span>
                <ConfirmButton
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  title={`Remove all ${VEHICLE_TYPE_LABEL[type as VehicleType]} years for ${model.name}?`}
                  confirmLabel="Remove all"
                  action={() => deleteVariantsForModel({ modelId: model.id, vehicleType: type })}
                >
                  Remove all
                </ConfirmButton>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {list
                  .sort((a, b) => a.year - b.year)
                  .map((v) => (
                    <span
                      key={v.id}
                      className={cn(
                        "group inline-flex items-center gap-1 rounded-md border bg-neutral-50 px-2 py-1 text-xs tabular-nums",
                      )}
                    >
                      {v.year}
                      <button
                        type="button"
                        aria-label={`Remove ${v.year}`}
                        className="text-neutral-400 hover:text-destructive"
                        onClick={async () => {
                          const res = await deleteVariant(v.id);
                          if (res.ok) router.refresh();
                          else toast.error(res.error);
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
