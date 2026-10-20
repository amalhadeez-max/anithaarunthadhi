import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Check, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { productCardInclude, toProductCard } from "@/lib/serializers";
import { formatINR, toNumber, discountPercent } from "@/lib/utils";
import { VEHICLE_TYPE_LABEL } from "@/lib/constants";
import { effectivePrice } from "@/lib/pricing";
import { ProductGallery } from "@/components/products/product-gallery";
import { VideoEmbed } from "@/components/products/video-embed";
import { BuyBox } from "@/components/products/buy-box";
import { ProductCard } from "@/components/products/product-card";
import { ReviewsSection } from "@/components/products/reviews-section";
import { MarkdownPreview } from "@/components/shared/markdown";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      compat: { include: { variant: { include: { model: true } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProduct(slug).catch(() => null), getSiteSettings()]);
  if (!p) return { title: "Product not found" };
  const desc = p.description.replace(/[#*_>`]/g, "").slice(0, 155);
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: `${p.name} | ${s.storeName}`,
      description: desc,
      type: "website",
      images: p.images[0] ? [{ url: p.images[0].url, alt: p.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: desc,
      images: p.images[0] ? [p.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const price = toNumber(p.price);
  const discount = p.discountPrice ? toNumber(p.discountPrice) : null;
  const eff = effectivePrice({ price, discountPrice: discount });
  const pct = discountPercent(price, discount);
  const specs = Object.entries((p.specs as Record<string, string>) ?? {});
  const ratingAvg = toNumber(p.ratingAvg);

  // Group compatible vehicles: "Brand Model · Type · 2019–2026"
  const compatGroups = Object.values(
    p.compat.reduce<Record<string, { model: string; type: string; years: number[] }>>((acc, c) => {
      const key = `${c.variant.modelId}-${c.variant.vehicleType}`;
      (acc[key] ??= {
        model: c.variant.model.name,
        type: VEHICLE_TYPE_LABEL[c.variant.vehicleType],
        years: [],
      }).years.push(c.variant.year);
      return acc;
    }, {}),
  ).map((g) => ({
    ...g,
    range: g.years.length > 1 ? `${Math.min(...g.years)}–${Math.max(...g.years)}` : String(g.years[0]),
  }));

  const related = await prisma.product.findMany({
    where: { isActive: true, id: { not: p.id }, OR: [{ brandId: p.brandId }, { categoryId: p.categoryId }] },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: 8,
    include: productCardInclude,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    image: p.images.map((i) => i.url),
    description: p.description.slice(0, 500),
    brand: { "@type": "Brand", name: p.brand.name },
    ...(p.ratingCount > 0
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: ratingAvg, reviewCount: p.ratingCount },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: eff,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container py-5 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
        </Link>{" "}
        <ChevronRight className="h-3 w-3" />
        <Link href={`/products?brand=${p.brand.slug}`} className="hover:underline">
          {p.brand.name}
        </Link>{" "}
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={p.images} name={p.name} />

        <div className="space-y-5">
          <div>
            <Link
              href={`/products?brand=${p.brand.slug}`}
              className="text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
            >
              {p.brand.name}
            </Link>
            <h1 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <a href="#reviews" className="inline-flex items-center gap-1 hover:underline">
                <StarRating value={ratingAvg} size="sm" showValue />
                <span className="text-muted-foreground">
                  ({p.ratingCount} review{p.ratingCount === 1 ? "" : "s"})
                </span>
              </a>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">SKU {p.sku}</span>
              <span className="text-muted-foreground">·</span>
              <Link
                href={`/products?category=${p.category.slug}`}
                className="text-muted-foreground hover:underline"
              >
                {p.category.name}
              </Link>
            </div>
          </div>

          <div className="rounded-xl border bg-neutral-50 p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-black">{formatINR(eff)}</span>
              {discount && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatINR(price)}</span>
                  <Badge variant="brand">{pct}% off</Badge>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
            <div className="mt-2 flex items-center gap-1.5 text-sm font-medium">
              {p.stock > 0 ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">In stock</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Out of stock</span>
                </>
              )}
            </div>
          </div>

          <BuyBox
            product={{
              productId: p.id,
              slug: p.slug,
              name: p.name,
              imageUrl: p.images[0]?.url ?? null,
              price,
              discountPrice: discount,
              stock: p.stock,
            }}
          />

          {compatGroups.length > 0 && (
            <section aria-labelledby="compat-heading">
              <h2 id="compat-heading" className="mb-2 text-sm font-semibold">
                Compatible vehicles
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {compatGroups.map((g) => (
                  <li key={g.model + g.type} className="rounded-full border bg-white px-3 py-1 text-xs">
                    <span className="font-semibold">
                      {p.brand.name} {g.model}
                    </span>{" "}
                    · {g.type} · {g.range}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="mb-3 text-xl font-bold">
              Description
            </h2>
            <MarkdownPreview content={p.description || "_No description provided._"} />
          </section>
          {p.videos.length > 0 && (
            <section aria-labelledby="video-heading">
              <h2 id="video-heading" className="mb-3 text-xl font-bold">
                Video
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {p.videos.map((v) => (
                  <VideoEmbed key={v.id} kind={v.kind} url={v.url} title={`${p.name} video`} />
                ))}
              </div>
            </section>
          )}
        </div>
        <section aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="mb-3 text-xl font-bold">
            Specifications
          </h2>
          {specs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specifications listed.</p>
          ) : (
            <table className="w-full overflow-hidden rounded-xl border text-sm">
              <tbody>
                {specs.map(([k, v], i) => (
                  <tr key={k} className={i % 2 ? "bg-white" : "bg-neutral-50"}>
                    <th scope="row" className="w-2/5 px-3 py-2 text-left font-medium text-neutral-600">
                      {k}
                    </th>
                    <td className="px-3 py-2">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="mt-12">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <ReviewsSection productId={p.id} ratingAvg={ratingAvg} ratingCount={p.ratingCount} />
        </Suspense>
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-4 text-xl font-bold">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.slice(0, 8).map((r) => (
              <ProductCard key={r.id} product={toProductCard(r)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
