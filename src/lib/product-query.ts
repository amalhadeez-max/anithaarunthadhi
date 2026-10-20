import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { segmentEnum, vehicleTypeEnum } from "@/lib/validations";

export const querySchema = z.object({
  q: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  model: z.string().uuid().optional(),
  year: z.coerce.number().int().min(1990).max(2100).optional(),
  segment: segmentEnum.optional(),
  type: vehicleTypeEnum.optional(),
  category: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  ids: z.string().optional(),
});
export type ProductQuery = z.infer<typeof querySchema>;

export function buildWhere(q: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q.ids) where.id = { in: q.ids.split(",").filter(Boolean).slice(0, 100) };
  if (q.q)
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { description: { contains: q.q, mode: "insensitive" } },
      { brand: { name: { contains: q.q, mode: "insensitive" } } },
    ];
  if (q.brand) where.brand = { slug: q.brand, isActive: true, deletedAt: null };
  if (q.category) where.category = { slug: q.category };
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    // Filter on the effective price: discount if present else price
    where.AND = [
      {
        OR: [
          {
            discountPrice: {
              not: null,
              ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
              ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
            },
          },
          {
            discountPrice: null,
            price: {
              ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
              ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
            },
          },
        ],
      },
    ];
  }
  // Compatibility filters (model / year / type) — all must match the same variant row
  if (q.model || q.year || q.type) {
    where.compat = {
      some: {
        variant: {
          ...(q.model ? { modelId: q.model } : {}),
          ...(q.year ? { year: q.year } : {}),
          ...(q.type ? { vehicleType: q.type } : {}),
        },
      },
    };
  }
  if (q.segment) {
    const seg = q.segment;
    where.AND = [
      ...((where.AND as Prisma.ProductWhereInput[]) ?? []),
      {
        OR: [
          { compat: { some: { variant: { model: { segment: seg } } } } },
          { AND: [{ compat: { none: {} } }, { brand: { segments: { some: { segment: seg } } } }] },
        ],
      },
    ];
  }
  return where;
}

export function buildOrderBy(sort: ProductQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}
