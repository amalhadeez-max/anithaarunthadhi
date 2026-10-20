import "server-only";
import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicEnv } from "@/lib/env";

export type SiteSettingsPlain = Omit<
  SiteSettings,
  "deliveryCharge" | "freeDeliveryThreshold" | "aboutGallery"
> & {
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  aboutGallery: string[];
};

const DEFAULTS: SiteSettingsPlain = {
  id: 1,
  storeName: publicEnv.storeName,
  logoUrl: null,
  tagline: "Accessories for every ride — bikes, cars & trucks",
  heroVideoUrl: null,
  heroYoutubeUrl: "https://youtube.com/shorts/Gjhb-jiVqZY",
  homeDescription: "",
  aboutStory: "",
  aboutMission: "",
  aboutGallery: [],
  mapEmbedUrl: null,
  contactPhone: null,
  contactEmail: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  altContactName: null,
  altContactPhone: null,
  youtubeUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  whatsappNumber: publicEnv.whatsappNumber,
  deliveryCharge: 49,
  freeDeliveryThreshold: 999,
  codEnabled: true,
  updatedAt: new Date(0),
};

/** Cached per request. Falls back to defaults if the DB is unreachable (keeps the UI alive). */
export const getSiteSettings = cache(async (): Promise<SiteSettingsPlain> => {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!row) return DEFAULTS;
    return {
      ...row,
      deliveryCharge: Number(row.deliveryCharge),
      freeDeliveryThreshold: Number(row.freeDeliveryThreshold),
      aboutGallery: Array.isArray(row.aboutGallery) ? (row.aboutGallery as string[]) : [],
      whatsappNumber: row.whatsappNumber || publicEnv.whatsappNumber,
    };
  } catch (e) {
    console.error("getSiteSettings failed, using defaults", e);
    return DEFAULTS;
  }
});
