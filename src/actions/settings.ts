"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { siteSettingsSchema, zodMessage } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function updateSiteSettings(input: unknown): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = siteSettingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
    const d = parsed.data;
    const nul = (v: string | null | undefined) => (v ? v : null);
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {
        storeName: d.storeName,
        logoUrl: nul(d.logoUrl),
        tagline: d.tagline,
        heroVideoUrl: nul(d.heroVideoUrl),
        heroYoutubeUrl: nul(d.heroYoutubeUrl),
        homeDescription: d.homeDescription,
        aboutStory: d.aboutStory,
        aboutMission: d.aboutMission,
        aboutGallery: d.aboutGallery,
        mapEmbedUrl: nul(d.mapEmbedUrl),
        contactPhone: nul(d.contactPhone),
        contactEmail: nul(d.contactEmail),
        addressLine1: nul(d.addressLine1),
        addressLine2: nul(d.addressLine2),
        city: nul(d.city),
        altContactName: nul(d.altContactName),
        altContactPhone: nul(d.altContactPhone),
        youtubeUrl: nul(d.youtubeUrl),
        instagramUrl: nul(d.instagramUrl),
        facebookUrl: nul(d.facebookUrl),
        whatsappNumber: d.whatsappNumber,
        deliveryCharge: new Prisma.Decimal(d.deliveryCharge),
        freeDeliveryThreshold: new Prisma.Decimal(d.freeDeliveryThreshold),
        codEnabled: d.codEnabled,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save settings" };
  }
}
