"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { productSchema, categorySchema, zodMessage, uuid } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/types";

function revalidateProducts(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
}

export async function upsertProduct(input: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await assertAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { id, specs, images, videos, variantIds, ...d } = parsed.data;

    const [slugClash, skuClash] = await Promise.all([
      prisma.product.findFirst({
        where: { slug: d.slug, NOT: id ? { id } : undefined },
        select: { name: true },
      }),
      prisma.product.findFirst({
        where: { sku: d.sku, NOT: id ? { id } : undefined },
        select: { name: true },
      }),
    ]);
    if (slugClash) return { ok: false, error: `Slug already used by "${slugClash.name}"` };
    if (skuClash) return { ok: false, error: `SKU already used by "${skuClash.name}"` };

    const specsJson = Object.fromEntries(specs.map((s) => [s.key, s.value]));
    const data = {
      ...d,
      specs: specsJson,
      price: new Prisma.Decimal(d.price),
      discountPrice: d.discountPrice ? new Prisma.Decimal(d.discountPrice) : null,
    };

    const row = await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({ data });
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length)
        await tx.productImage.createMany({
          data: images.map((url, i) => ({ productId: product.id, url, alt: d.name, sortOrder: i })),
        });
      await tx.productVideo.deleteMany({ where: { productId: product.id } });
      if (videos.length)
        await tx.productVideo.createMany({
          data: videos.map((v, i) => ({ productId: product.id, kind: v.kind, url: v.url, sortOrder: i })),
        });
      await tx.productVariantCompat.deleteMany({
        where: { productId: product.id, vehicleVariantId: { notIn: variantIds } },
      });
      if (variantIds.length)
        await tx.productVariantCompat.createMany({
          data: variantIds.map((vehicleVariantId) => ({ productId: product.id, vehicleVariantId })),
          skipDuplicates: true,
        });
      return product;
    });
    revalidateProducts(row.slug);
    return {
      ok: true,
      data: { id: row.id, slug: row.slug },
      message: id ? "Product updated" : "Product created",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save product" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const orders = await prisma.orderItem.count({ where: { productId: id } });
    if (orders > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return {
        ok: true,
        message: "Product appears in past orders, so it was deactivated instead of deleted.",
      };
    }
    await prisma.product.delete({ where: { id } });
    revalidateProducts();
    return { ok: true, message: "Product deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete product" };
  }
}

export async function bulkSetProductsActive(ids: string[], isActive: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = z.array(uuid).min(1).max(500).safeParse(ids);
    if (!parsed.success) return { ok: false, error: "Select at least one product" };
    const res = await prisma.product.updateMany({ where: { id: { in: parsed.data } }, data: { isActive } });
    revalidateProducts();
    return {
      ok: true,
      message: `${res.count} product${res.count === 1 ? "" : "s"} ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function upsertCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { id, ...d } = parsed.data;
    const data = { ...d, segment: d.segment ?? null };
    const row = id
      ? await prisma.category.update({ where: { id }, data })
      : await prisma.category.create({ data });
    revalidateProducts();
    return { ok: true, data: { id: row.id }, message: "Category saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const n = await prisma.product.count({ where: { categoryId: id } });
    if (n > 0) return { ok: false, error: `${n} product(s) use this category` };
    await prisma.category.delete({ where: { id } });
    revalidateProducts();
    return { ok: true, message: "Category deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * CSV import. Columns: name, slug, sku, brand (slug or name), category (slug or name), price,
 * discount_price, stock, description, is_active, images (| separated), specs (key=value; key=value),
 * youtube_url. Existing SKU → update; otherwise create.
 */
const csvRow = z.object({
  name: z.string().trim().min(3),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.coerce.number().positive(),
  discount_price: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  description: z.string().optional().default(""),
  is_active: z.string().optional(),
  images: z.string().optional(),
  specs: z.string().optional(),
  youtube_url: z.string().optional(),
});

export async function importProductsCsv(
  formData: FormData,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  try {
    await assertAdmin();
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Choose a CSV file" };
    if (file.size > 2 * 1024 * 1024) return { ok: false, error: "CSV too large (max 2 MB)" };
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    if (parsed.errors.length) return { ok: false, error: `CSV parse error: ${parsed.errors[0].message}` };

    const [brands, categories] = await Promise.all([
      prisma.brand.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, name: true } }),
      prisma.category.findMany({ select: { id: true, slug: true, name: true } }),
    ]);
    const findBrand = (s: string) =>
      brands.find((b) => b.slug === slugify(s) || b.name.toLowerCase() === s.toLowerCase());
    const findCat = (s: string) =>
      categories.find((c) => c.slug === slugify(s) || c.name.toLowerCase() === s.toLowerCase());

    let created = 0,
      updated = 0;
    const errors: string[] = [];
    for (const [i, raw] of parsed.data.entries()) {
      const r = csvRow.safeParse(raw);
      if (!r.success) {
        errors.push(`Row ${i + 2}: ${zodMessage(r.error)}`);
        continue;
      }
      const d = r.data;
      const brand = findBrand(d.brand);
      const category = findCat(d.category);
      if (!brand) {
        errors.push(`Row ${i + 2}: unknown brand "${d.brand}"`);
        continue;
      }
      if (!category) {
        errors.push(`Row ${i + 2}: unknown category "${d.category}"`);
        continue;
      }
      const specs = Object.fromEntries(
        (d.specs ?? "")
          .split(";")
          .map((kv) => kv.split("=").map((x) => x.trim()))
          .filter(([k, v]) => k && v),
      );
      const images = (d.images ?? "")
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean);
      const isActive =
        d.is_active === undefined || d.is_active === "" ? true : /^(1|true|yes|y)$/i.test(d.is_active);
      const data = {
        name: d.name,
        slug: d.slug || slugify(d.name),
        sku: d.sku,
        brandId: brand.id,
        categoryId: category.id,
        description: d.description,
        specs,
        price: new Prisma.Decimal(d.price),
        discountPrice: d.discount_price ? new Prisma.Decimal(d.discount_price) : null,
        stock: d.stock,
        isActive,
      };
      try {
        const existing = await prisma.product.findUnique({ where: { sku: d.sku } });
        await prisma.$transaction(async (tx) => {
          const p = existing
            ? await tx.product.update({ where: { id: existing.id }, data })
            : await tx.product.create({ data });
          if (images.length) {
            await tx.productImage.deleteMany({ where: { productId: p.id } });
            await tx.productImage.createMany({
              data: images.map((url, idx) => ({ productId: p.id, url, alt: d.name, sortOrder: idx })),
            });
          }
          if (d.youtube_url) {
            await tx.productVideo.deleteMany({ where: { productId: p.id, kind: "youtube" } });
            await tx.productVideo.create({ data: { productId: p.id, kind: "youtube", url: d.youtube_url } });
          }
        });
        if (existing) updated++;
        else created++;
      } catch (e) {
        errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message.split("\n")[0] : "failed"}`);
      }
    }
    revalidateProducts();
    return {
      ok: true,
      data: { created, updated, errors },
      message: `Imported: ${created} created, ${updated} updated${errors.length ? `, ${errors.length} errors` : ""}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Import failed" };
  }
}
