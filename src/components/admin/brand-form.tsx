"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { upsertBrand } from "@/actions/brands";
import { slugify } from "@/lib/utils";
import { SEGMENTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/shared/image-uploader";

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  segments: BrandInput["segments"];
};

export function BrandFormDialog({ brand, trigger }: { brand?: BrandRow; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: brand
      ? { ...brand, logoUrl: brand.logoUrl ?? "" }
      : { name: "", slug: "", logoUrl: "", segments: [], sortOrder: 0, isActive: true },
  });
  const { register, handleSubmit, formState, watch, setValue, control, reset } = form;
  const name = watch("name");
  const slugTouched = formState.dirtyFields.slug;

  useEffect(() => {
    if (!brand && !slugTouched) setValue("slug", slugify(name || ""));
  }, [name, brand, slugTouched, setValue]);

  useEffect(() => {
    if (open)
      reset(
        brand
          ? { ...brand, logoUrl: brand.logoUrl ?? "" }
          : { name: "", slug: "", logoUrl: "", segments: [], sortOrder: 0, isActive: true },
      );
  }, [open, brand, reset]);

  async function onSubmit(values: BrandInput) {
    const res = await upsertBrand({ ...values, id: brand?.id });
    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size={brand ? "icon-sm" : "default"}
            variant={brand ? "ghost" : "default"}
            aria-label={brand ? "Edit brand" : undefined}
          >
            {brand ? (
              <Pencil />
            ) : (
              <>
                <Plus /> Add brand
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? `Edit ${brand.name}` : "Add brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Name" htmlFor="b-name" error={formState.errors.name?.message} required>
            <Input id="b-name" {...register("name")} placeholder="Hero" />
          </FormField>
          <FormField
            label="Slug"
            htmlFor="b-slug"
            error={formState.errors.slug?.message}
            hint="Used in URLs: /products?brand=hero"
            required
          >
            <Input id="b-slug" {...register("slug")} placeholder="hero" />
          </FormField>
          <FormField
            label="Segments"
            error={formState.errors.segments?.message as string | undefined}
            required
          >
            <Controller
              control={control}
              name="segments"
              render={({ field }) => (
                <div className="flex flex-wrap gap-4">
                  {SEGMENTS.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(s.value)}
                        onCheckedChange={(c) =>
                          field.onChange(
                            c ? [...field.value, s.value] : field.value.filter((v) => v !== s.value),
                          )
                        }
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              )}
            />
          </FormField>
          <FormField label="Logo / miniature image" error={formState.errors.logoUrl?.message}>
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUploader
                  folder="brands"
                  value={field.value ? [field.value] : []}
                  onChange={(u) => field.onChange(u[0] ?? "")}
                  max={1}
                  label="Upload logo"
                />
              )}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sort order" htmlFor="b-sort" error={formState.errors.sortOrder?.message}>
              <Input id="b-sort" type="number" min={0} {...register("sortOrder")} />
            </FormField>
            <FormField label="Active">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex h-10 items-center gap-2">
                    <Switch checked={field.value} onCheckedChange={field.onChange} id="b-active" />
                    <label htmlFor="b-active" className="text-sm">
                      {field.value ? "Visible" : "Hidden"}
                    </label>
                  </div>
                )}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formState.isSubmitting}>
              {brand ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
