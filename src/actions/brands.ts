"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { brandSchema, zodMessage } from "@/lib/validations";
import type { ActionResult } from "@/types";

function revalidateCatalogue() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/variants");
}

export async function upsertBrand(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    const parsed = brandSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { id, segments, ...d } = parsed.data;
    const data = { ...d, logoUrl: d.logoUrl || null };

    const clash = await prisma.brand.findFirst({ where: { slug: d.slug, NOT: id ? { id } : undefined } });
    if (clash) return { ok: false, error: `Slug "${d.slug}" is already used by ${clash.name}` };

    const row = await prisma.$transaction(async (tx) => {
      const brand = id
        ? await tx.brand.update({ where: { id }, data })
        : await tx.brand.create({ data: { ...data, deletedAt: null } });
      await tx.brandSegment.deleteMany({ where: { brandId: brand.id, segment: { notIn: segments } } });
      await tx.brandSegment.createMany({
        data: segments.map((segment) => ({ brandId: brand.id, segment })),
        skipDuplicates: true,
      });
      return brand;
    });
    revalidateCatalogue();
    return { ok: true, data: { id: row.id }, message: id ? "Brand updated" : "Brand created" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save brand" };
  }
}

export async function toggleBrandActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.brand.update({ where: { id }, data: { isActive } });
    revalidateCatalogue();
    return { ok: true, message: isActive ? "Brand activated" : "Brand hidden" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Soft delete. Blocked while any products reference the brand. */
export async function deleteBrand(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const products = await prisma.product.count({ where: { brandId: id } });
    if (products > 0) {
      return {
        ok: false,
        error: `Cannot delete: ${products} product${products > 1 ? "s" : ""} still belong to this brand. Reassign or delete them first.`,
      };
    }
    await prisma.brand.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    revalidateCatalogue();
    return { ok: true, message: "Brand deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete brand" };
  }
}

export async function restoreBrand(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.brand.update({ where: { id }, data: { deletedAt: null, isActive: true } });
    revalidateCatalogue();
    return { ok: true, message: "Brand restored" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
