"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { BrandCard } from "@/types";
import { SectionHeading } from "./section-heading";

const PREVIEW = 12;

/** Row of brand tiles with a live search; links to the full brand directory on /products. */
export function BrandStrip({ brands }: { brands: BrandCard[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term ? brands.filter((b) => b.name.toLowerCase().includes(term)) : brands;
    return term ? filtered : filtered.slice(0, PREVIEW);
  }, [brands, q]);

  return (
    <section className="container pt-10 md:pt-12" aria-labelledby="brands-h">
      <SectionHeading
        id="brands-h"
        title="Shop by Brand"
        subtitle="Trusted brands we supply"
        action={
          <label className="relative block w-full sm:w-[204px]">
            <span className="sr-only">Search by brand</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by brand..."
              className="h-[34px] w-full rounded-md border bg-white pl-9 pr-3 text-xs placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
            />
          </label>
        }
      />
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No brands match “{q}”.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {list.map((b) => (
            <li key={b.id}>
              <Link
                href={`/products?brand=${b.slug}`}
                aria-label={`${b.name} accessories`}
                title={b.name}
                className="flex h-[72px] items-center justify-center rounded-md border bg-white px-4 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md md:h-20"
              >
                {b.logoUrl ? (
                  <span className="relative block h-10 w-full">
                    <Image src={b.logoUrl} alt={b.name} fill sizes="160px" className="object-contain" />
                  </span>
                ) : (
                  <span className="text-sm font-semibold">{b.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!q && brands.length > PREVIEW && (
        <div className="mt-4 text-right">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium hover:text-brand">
            View all {brands.length} brands <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
