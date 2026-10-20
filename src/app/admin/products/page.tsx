import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsTable } from "@/components/admin/products-table";
import { ProductsToolbar } from "@/components/admin/products-toolbar";
import { CategoryManager } from "@/components/admin/category-manager";
import { Pagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";

type SP = { q?: string; brand?: string; category?: string; status?: string; page?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where: Prisma.ProductWhereInput = {
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" } },
            { sku: { contains: sp.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(sp.brand ? { brandId: sp.brand } : {}),
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.status === "active"
      ? { isActive: true }
      : sp.status === "hidden"
        ? { isActive: false }
        : sp.status === "low"
          ? { stock: { lte: LOW_STOCK_THRESHOLD } }
          : {}),
  };

  const [total, products, brands, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        _count: { select: { compat: true } },
      },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand: p.brand.name,
    category: p.category.name,
    price: toNumber(p.price),
    discountPrice: p.discountPrice ? toNumber(p.discountPrice) : null,
    stock: p.stock,
    isActive: p.isActive,
    imageUrl: p.images[0]?.url ?? null,
    compatCount: p._count.compat,
  }));
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const makeHref = (p: number) => {
    const n = new URLSearchParams(sp as Record<string, string>);
    n.set("page", String(p));
    return `/admin/products?${n.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}`}
        actions={
          <>
            <CategoryManager
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                segment: c.segment,
                count: c._count.products,
              }))}
            />
            <Button asChild size="sm">
              <Link href="/admin/products/new">
                <Plus /> Add product
              </Link>
            </Button>
          </>
        }
      />
      <Suspense>
        <ProductsToolbar brands={brands} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </Suspense>
      <ProductsTable rows={rows} />
      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </>
  );
}
