"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/auth";
import { profileSchema, addressSchema, zodMessage } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function updateProfile(input: unknown): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const d = parsed.data;
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        fullName: d.fullName,
        phone: d.phone || null,
        avatarUrl: d.avatarUrl || null,
        addressLine1: d.addressLine1 || null,
        addressLine2: d.addressLine2 || null,
        city: d.city || null,
        state: d.state || null,
        pincode: d.pincode || null,
      },
    });
    revalidatePath("/profile");
    return { ok: true, message: "Profile updated" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update profile" };
  }
}

export async function saveAddress(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertUser();
    const parsed = addressSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const { id, ...d } = parsed.data;
    const data = { ...d, line2: d.line2 || null, userId: user.id };
    const row = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      const isDefault = d.isDefault || count === 0;
      if (isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      if (id) {
        const existing = await tx.address.findFirst({ where: { id, userId: user.id } });
        if (!existing) throw new Error("Address not found");
        return tx.address.update({ where: { id }, data: { ...data, isDefault } });
      }
      return tx.address.create({ data: { ...data, isDefault } });
    });
    revalidatePath("/checkout");
    revalidatePath("/profile");
    return { ok: true, data: { id: row.id }, message: "Address saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save address" };
  }
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  try {
    const user = await assertUser();
    await prisma.address.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/checkout");
    revalidatePath("/profile");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete address" };
  }
}
