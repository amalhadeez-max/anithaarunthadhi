import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveBrands } from "@/lib/catalogue";
import { productCardInclude, toProductCard } from "@/lib/serializers";
import { querySchema, buildWhere, buildOrderBy } from "@/lib/product-query";
import { PAGE_SIZE, SEGMENT_LABEL } from "@/lib/constants";
import { BrandGrid } from "@/components/home/brand-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import type { Segment } from "@prisma/client";

type SP = Record<string, string | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  if (sp.brand) {
    const b = await prisma.brand
      .findUnique({ where: { slug: sp.brand }, select: { name: true } })
      .catch(() => null);
    if (b)
      return {
        title: `${b.name} accessories`,
        description: `Shop ${b.name} accessories by model, year and vehicle type.`,
      };
  }
  if (sp.q) return { title: `Search: ${sp.q}` };
  return {
    title: "Products",
    description: "Browse vehicle accessories by brand for two-wheelers, cars and trucks.",
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const parsed = querySchema.safeParse(sp);
  const q = parsed.success ? parsed.data : querySchema.parse({});
  const browsing = Boolean(q.brand || q.q || q.category || q.model);

  // Step 1: brand grid
  if (!browsing) {
    const brands = await getActiveBrands();
    return (
      <div className="container py-6 md:py-10">
        <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          <ChevronRight className="inline h-3 w-3" /> Products
        </nav>
        <BrandGrid
          brands={brands}
          initialTab={(q.segment as Segment | undefined) ?? "all"}
          title="Choose your vehicle brand"
        />
      </div>
    );
  }

  // Step 2: filters + product grid (with SSR'd first page for fast paint & SEO)
  const [brand, categories, total, items] = await Promise.all([
    q.brand ? prisma.brand.findUnique({ where: { slug: q.brand }, include: { segments: true } }) : null,
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, name: true, segment: true },
    }),
    prisma.product.count({ where: buildWhere(q) }),
    prisma.product.findMany({
      where: buildWhere(q),
      orderBy: buildOrderBy(q.sort),
      skip: (q.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: productCardInclude,
    }),
  ]);
  const initial = {
    items: items.map(toProductCard),
    total,
    page: q.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
  const brandSegments = brand?.segments.map((s) => s.segment) ?? [];

  return (
    <div className="container py-6 md:py-10">
      <nav
        className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {brand && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{brand.name}</span>
          </>
        )}
        {q.q && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">“{q.q}”</span>
          </>
        )}
      </nav>

      <header className="mb-6 flex items-center gap-4">
        {brand?.logoUrl && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-white p-1 md:h-20 md:w-20">
            <Image src={brand.logoUrl} alt="" fill sizes="80px" className="object-contain p-1" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {brand ? `${brand.name} accessories` : q.q ? `Results for “${q.q}”` : "Products"}
          </h1>
          {brand && (
            <p className="text-sm text-muted-foreground">
              {brandSegments.map((s) => SEGMENT_LABEL[s]).join(" · ")} · Filter by model, year and type to see
              only parts that fit.
            </p>
          )}
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Suspense>
              <ProductFilters
                variant="sidebar"
                brandSlug={brand?.slug ?? null}
                brandSegments={brandSegments}
                categories={categories}
              />
            </Suspense>
          </div>
        </aside>
        <section aria-label="Products">
          <div className="mb-4">
            <Suspense>
              <ProductFilters
                variant="bar"
                brandSlug={brand?.slug ?? null}
                brandSegments={brandSegments}
                categories={categories}
              />
            </Suspense>
          </div>
          <Suspense>
            <ProductGrid initial={initial} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
