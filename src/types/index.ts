import type { Segment, VehicleType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

/** Serialisable product card data (Decimals converted to numbers). */
export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  imageUrl: string | null;
  brandName: string;
  brandSlug: string;
  categoryName: string;
  categorySlug: string;
  createdAt: string;
};

export type BrandCard = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  segments: Segment[];
};

export type VariantOption = {
  id: string;
  year: number;
  vehicleType: VehicleType;
};

export type ModelWithVariants = {
  id: string;
  name: string;
  slug: string;
  segment: Segment;
  variants: VariantOption[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  quantity: number;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  items: { id: string; name: string; imageUrl: string | null; quantity: number; unitPrice: number }[];
};
