import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { productCardInclude, toProductCard } from "@/lib/serializers";
import { PAGE_SIZE } from "@/lib/constants";
import { querySchema, buildWhere, buildOrderBy } from "@/lib/product-query";

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const q = parsed.data;
  const where = buildWhere(q);
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(q.sort),
      skip: (q.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: productCardInclude,
    }),
  ]);
  return NextResponse.json(
    {
      items: items.map(toProductCard),
      total,
      page: q.page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}
