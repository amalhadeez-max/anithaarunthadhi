"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { vehicleModelSchema, bulkVariantSchema, zodMessage, uuid, vehicleTypeEnum } from "@/lib/validations";
import type { ActionResult } from "@/types";
import { z } from "zod";

function revalidate() {
  revalidatePath("/products");
  revalidatePath("/admin/variants");
}

export async function upsertModel(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    const parsed = vehicleModelSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { id, ...d } = parsed.data;
    const slug = d.slug || slugify(d.name);
    const clash = await prisma.vehicleModel.findFirst({
      where: { brandId: d.brandId, slug, NOT: id ? { id } : undefined },
    });
    if (clash) return { ok: false, error: `Model "${clash.name}" already exists for this brand` };
    const data = {
      brandId: d.brandId,
      segment: d.segment,
      name: d.name,
      slug,
      imageUrl: d.imageUrl || null,
      isActive: d.isActive,
    };
    const row = id
      ? await prisma.vehicleModel.update({ where: { id }, data })
      : await prisma.vehicleModel.create({ data });
    revalidate();
    return { ok: true, data: { id: row.id }, message: id ? "Model updated" : "Model added" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save model" };
  }
}

export async function deleteModel(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const compat = await prisma.productVariantCompat.count({ where: { variant: { modelId: id } } });
    if (compat > 0)
      return {
        ok: false,
        error: `This model's variants are linked to ${compat} product compatibility rows. Unlink them first.`,
      };
    await prisma.vehicleModel.delete({ where: { id } });
    revalidate();
    return { ok: true, message: "Model deleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete model" };
  }
}

/** Bulk-add a year range for a model + vehicle type (idempotent). */
export async function bulkAddVariants(input: unknown): Promise<ActionResult<{ added: number }>> {
  try {
    await assertAdmin();
    const parsed = bulkVariantSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { modelId, yearFrom, yearTo, vehicleType } = parsed.data;
    if (yearTo - yearFrom > 60) return { ok: false, error: "Year range too large" };
    const rows = [];
    for (let year = yearFrom; year <= yearTo; year++) rows.push({ modelId, year, vehicleType });
    const res = await prisma.vehicleVariant.createMany({ data: rows, skipDuplicates: true });
    revalidate();
    return {
      ok: true,
      data: { added: res.count },
      message: `${res.count} variant${res.count === 1 ? "" : "s"} added`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add variants" };
  }
}

export async function deleteVariant(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.vehicleVariant.delete({ where: { id } });
    revalidate();
    return { ok: true, message: "Variant removed" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

const deleteVariantsSchema = z.object({ modelId: uuid, vehicleType: vehicleTypeEnum.optional() });
export async function deleteVariantsForModel(input: unknown): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = deleteVariantsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const res = await prisma.vehicleVariant.deleteMany({
      where: { modelId: parsed.data.modelId, vehicleType: parsed.data.vehicleType },
    });
    revalidate();
    return { ok: true, message: `${res.count} variants removed` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
