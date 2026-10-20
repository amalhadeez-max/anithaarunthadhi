import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ModelWithVariants } from "@/types";

/** GET /api/variants?brand=<slug>|brandId=<uuid>  → models with their variants (used by filters & product form). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const brandSlug = sp.get("brand");
  const brandId = sp.get("brandId");
  if (!brandSlug && !brandId)
    return NextResponse.json({ error: "brand or brandId required" }, { status: 400 });

  const models = await prisma.vehicleModel.findMany({
    where: { brand: brandId ? { id: brandId } : { slug: brandSlug! }, isActive: true },
    orderBy: { name: "asc" },
    include: {
      variants: {
        orderBy: [{ vehicleType: "asc" }, { year: "desc" }],
        select: { id: true, year: true, vehicleType: true },
      },
    },
  });

  const data: ModelWithVariants[] = models.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    segment: m.segment,
    variants: m.variants,
  }));
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
