import Papa from "papaparse";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: true, category: true, images: { orderBy: { sortOrder: "asc" } }, videos: true },
  });
  const rows = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand: p.brand.slug,
    category: p.category.slug,
    price: p.price.toString(),
    discount_price: p.discountPrice?.toString() ?? "",
    stock: p.stock,
    is_active: p.isActive ? "true" : "false",
    description: p.description,
    images: p.images.map((i) => i.url).join("|"),
    specs: Object.entries((p.specs as Record<string, string>) ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
    youtube_url: p.videos.find((v) => v.kind === "youtube")?.url ?? "",
    rating_avg: p.ratingAvg.toString(),
    rating_count: p.ratingCount,
    created_at: p.createdAt.toISOString(),
  }));
  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
