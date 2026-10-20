import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter a valid 6-digit pincode");

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

export const uuid = z.string().uuid();

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Enter your name").max(80),
  phone: phoneSchema.optional().or(z.literal("")),
});
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

// ── Profile ──
export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  addressLine1: z.string().trim().max(160).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: pincodeSchema.optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ── Address ──
export const addressSchema = z.object({
  id: uuid.optional(),
  label: z.string().trim().min(1).max(30).default("Home"),
  fullName: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: pincodeSchema,
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

// ── Catalogue ──
export const segmentEnum = z.enum(["two_wheeler", "four_wheeler", "truck"]);
export const vehicleTypeEnum = z.enum([
  "bike",
  "scooter",
  "ev",
  "moped",
  "hatchback",
  "sedan",
  "suv",
  "muv",
  "pickup",
  "light_truck",
  "heavy_truck",
  "tipper",
  "trailer",
  "bus",
]);

export const brandSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(2).max(60),
  slug: slugSchema,
  logoUrl: z.string().url().optional().or(z.literal("")),
  segments: z.array(segmentEnum).min(1, "Pick at least one segment"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type BrandInput = z.infer<typeof brandSchema>;

export const vehicleModelSchema = z.object({
  id: uuid.optional(),
  brandId: uuid,
  segment: segmentEnum,
  name: z.string().trim().min(1).max(60),
  slug: slugSchema.optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export type VehicleModelInput = z.infer<typeof vehicleModelSchema>;

export const bulkVariantSchema = z
  .object({
    modelId: uuid,
    yearFrom: z.coerce.number().int().min(1990).max(2100),
    yearTo: z.coerce.number().int().min(1990).max(2100),
    vehicleType: vehicleTypeEnum,
  })
  .refine((v) => v.yearTo >= v.yearFrom, { message: "End year must be ≥ start year", path: ["yearTo"] });
export type BulkVariantInput = z.infer<typeof bulkVariantSchema>;

export const categorySchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(2).max(60),
  slug: slugSchema,
  segment: segmentEnum.optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const specEntrySchema = z.object({
  key: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export const productSchema = z
  .object({
    id: uuid.optional(),
    name: z.string().trim().min(3).max(140),
    slug: slugSchema,
    sku: z.string().trim().min(2).max(40),
    brandId: uuid,
    categoryId: uuid,
    description: z.string().max(10_000).default(""),
    specs: z.array(specEntrySchema).default([]),
    price: z.coerce.number().positive("Price must be > 0"),
    discountPrice: z.coerce.number().positive().optional().nullable(),
    stock: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    images: z.array(z.string().url()).max(10).default([]),
    videos: z
      .array(z.object({ kind: z.enum(["upload", "youtube"]), url: z.string().url() }))
      .max(3)
      .default([]),
    variantIds: z.array(uuid).default([]),
  })
  .refine((p) => !p.discountPrice || p.discountPrice < p.price, {
    message: "Discount price must be less than price",
    path: ["discountPrice"],
  });
export type ProductInput = z.infer<typeof productSchema>;

// ── Reviews ──
export const reviewSchema = z.object({
  productId: uuid,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
  images: z.array(z.string().url()).max(3).default([]),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

// ── Cart / Checkout ──
export const cartLineSchema = z.object({ productId: uuid, quantity: z.number().int().min(1).max(10) });
export const checkoutSchema = z.object({
  addressId: uuid,
  paymentMethod: z.enum(["razorpay", "cod"]),
  items: z.array(cartLineSchema).min(1, "Your cart is empty"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ── Contact ──
export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Enter a valid email"),
  phone: phoneSchema.optional().or(z.literal("")),
  subject: z.enum(["general_inquiry", "product_question", "support", "partnership"]),
  message: z.string().trim().min(5, "Write a short message").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ── Admin orders ──
export const orderStatusEnum = z.enum([
  "pending_payment",
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
]);
export const updateOrderStatusSchema = z.object({
  orderId: uuid,
  status: orderStatusEnum,
  note: z.string().trim().max(300).optional().or(z.literal("")),
});
export const trackingSchema = z.object({
  orderId: uuid,
  courier: z.string().trim().max(60).optional().or(z.literal("")),
  trackingNumber: z.string().trim().max(80).optional().or(z.literal("")),
});

// ── Site settings ──
const optUrl = z.string().trim().url().optional().or(z.literal("")).nullable();
const optStr = z.string().trim().max(300).optional().or(z.literal("")).nullable();
export const siteSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(60),
  logoUrl: optUrl,
  tagline: z.string().trim().max(160),
  heroVideoUrl: optUrl,
  heroYoutubeUrl: optUrl,
  homeDescription: z.string().max(2000),
  aboutStory: z.string().max(10_000),
  aboutMission: z.string().max(5_000),
  aboutGallery: z.array(z.string().url()).max(12).default([]),
  mapEmbedUrl: optUrl,
  contactPhone: optStr,
  contactEmail: z.string().trim().email().optional().or(z.literal("")).nullable(),
  addressLine1: optStr,
  addressLine2: optStr,
  city: optStr,
  altContactName: optStr,
  altContactPhone: optStr,
  youtubeUrl: optUrl,
  instagramUrl: optUrl,
  facebookUrl: optUrl,
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Digits only, with country code (e.g. 918608612481)"),
  deliveryCharge: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0),
  codEnabled: z.boolean(),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

/** Flatten a ZodError into a single readable message */
export function zodMessage(err: z.ZodError) {
  return err.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`).join("; ");
}
