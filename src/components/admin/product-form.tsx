"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { productSchema, type ProductInput } from "@/lib/validations";
import { upsertProduct } from "@/actions/products";
import { slugify, youtubeId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/image-uploader";
import { SpecEditor } from "./spec-editor";
import { CompatPicker } from "./compat-picker";
import { MarkdownPreview } from "@/components/shared/markdown";

export type ProductFormValues = ProductInput;

export function ProductForm({
  initial,
  brands,
  categories,
}: {
  initial?: ProductFormValues & { id: string };
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ?? {
      name: "",
      slug: "",
      sku: "",
      brandId: "",
      categoryId: "",
      description: "",
      specs: [],
      price: 0,
      discountPrice: null,
      stock: 0,
      isActive: true,
      images: [],
      videos: [],
      variantIds: [],
    },
  });
  const { register, handleSubmit, formState, watch, setValue, control } = form;
  const name = watch("name");
  const brandId = watch("brandId");
  const description = watch("description");
  const videos = watch("videos");

  useEffect(() => {
    if (!initial && !formState.dirtyFields.slug) setValue("slug", slugify(name || ""));
  }, [name, initial, formState.dirtyFields.slug, setValue]);

  async function onSubmit(values: ProductInput) {
    const res = await upsertProduct({
      ...values,
      id: initial?.id,
      specs: values.specs.filter((s) => s.key && s.value),
    });
    if (res.ok) {
      toast.success(res.message);
      router.push("/admin/products");
      router.refresh();
    } else toast.error(res.error);
  }

  const err = formState.errors;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-3" noValidate>
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Product name"
              htmlFor="p-name"
              error={err.name?.message}
              required
              className="sm:col-span-2"
            >
              <Input id="p-name" {...register("name")} placeholder="Full Face ISI Helmet – Matte Black" />
            </FormField>
            <FormField label="Slug" htmlFor="p-slug" error={err.slug?.message} required>
              <Input id="p-slug" {...register("slug")} />
            </FormField>
            <FormField label="SKU" htmlFor="p-sku" error={err.sku?.message} required>
              <Input id="p-sku" {...register("sku")} placeholder="AN-0031" />
            </FormField>
            <FormField label="Brand" error={err.brandId?.message} required>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("variantIds", []);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Category" error={err.categoryId?.message} required>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Markdown supported"
              htmlFor="p-desc"
              error={err.description?.message}
              hint="**bold**, lists, headings, links"
            >
              <Textarea id="p-desc" rows={12} {...register("description")} className="font-mono text-xs" />
            </FormField>
            <div>
              <div className="mb-1.5 text-sm font-medium text-neutral-700">Preview</div>
              <div className="min-h-40 rounded-md border bg-neutral-50 p-3">
                <MarkdownPreview content={description || "_Nothing yet_"} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="specs"
              render={({ field }) => <SpecEditor value={field.value} onChange={field.onChange} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compatible vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="variantIds"
              render={({ field }) => (
                <CompatPicker brandId={brandId} value={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Pricing & stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField label="Price (₹)" htmlFor="p-price" error={err.price?.message} required>
              <Input id="p-price" type="number" step="0.01" min={0} {...register("price")} />
            </FormField>
            <FormField
              label="Discount price (₹)"
              htmlFor="p-dprice"
              error={err.discountPrice?.message}
              hint="Leave blank for no discount"
            >
              <Input
                id="p-dprice"
                type="number"
                step="0.01"
                min={0}
                {...register("discountPrice", {
                  setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
                })}
              />
            </FormField>
            <FormField label="Stock quantity" htmlFor="p-stock" error={err.stock?.message} required>
              <Input id="p-stock" type="number" min={0} {...register("stock")} />
            </FormField>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <label htmlFor="p-active" className="text-sm font-medium">
                    Active (visible in store)
                  </label>
                  <Switch id="p-active" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader folder="products" value={field.value} onChange={field.onChange} max={10} />
              )}
            />
            {err.images?.message && (
              <p className="mt-1 text-xs text-destructive">{err.images.message as string}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Controller
              control={control}
              name="videos"
              render={({ field }) => (
                <>
                  {field.value.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium uppercase">
                        {v.kind}
                      </span>
                      <span className="flex-1 truncate">{v.url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        aria-label="Remove video"
                        onClick={() => field.onChange(field.value.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  {field.value.length < 3 && (
                    <>
                      <div className="flex gap-2">
                        <Input
                          id="yt"
                          placeholder="YouTube URL"
                          className="h-9"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const el = e.currentTarget;
                              if (youtubeId(el.value)) {
                                field.onChange([...field.value, { kind: "youtube", url: el.value.trim() }]);
                                el.value = "";
                              } else toast.error("Not a valid YouTube URL");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            const el = document.getElementById("yt") as HTMLInputElement | null;
                            if (!el) return;
                            if (youtubeId(el.value)) {
                              field.onChange([...field.value, { kind: "youtube", url: el.value.trim() }]);
                              el.value = "";
                            } else toast.error("Not a valid YouTube URL");
                          }}
                        >
                          <Plus /> Add
                        </Button>
                      </div>
                      <ImageUploader
                        folder="videos"
                        accept="video/mp4,video/webm"
                        value={[]}
                        onChange={(u) =>
                          u[0] && field.onChange([...field.value, { kind: "upload", url: u[0] }])
                        }
                        max={1}
                        label="Upload MP4"
                        compact
                        allowUrl={false}
                      />
                    </>
                  )}
                </>
              )}
            />
            {videos.length === 0 && (
              <p className="text-xs text-muted-foreground">Optional. YouTube links save storage.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={formState.isSubmitting}>
            {initial ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
