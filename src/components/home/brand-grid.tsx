"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bike, Car, Search, Truck, type LucideIcon } from "lucide-react";
import type { Segment } from "@prisma/client";
import type { BrandCard } from "@/types";
import { SEGMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tab = "all" | Segment;

const SEGMENT_ICON: Record<Segment, LucideIcon> = {
  two_wheeler: Bike,
  four_wheeler: Car,
  truck: Truck,
};

/**
 * Brand directory in the style of a logo catalogue: a search box + segment tabs
 * above large white cards, each with a segment badge, a big centred logo and the
 * brand name underneath. 2 cols on mobile → 5 on desktop.
 */
export function BrandGrid({
  brands,
  initialTab = "all",
  title,
  compact = false,
}: {
  brands: BrandCard[];
  initialTab?: Tab;
  title?: string;
  compact?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter(
      (b) => (tab === "all" || b.segments.includes(tab)) && (!q || b.name.toLowerCase().includes(q)),
    );
  }, [brands, tab, query]);

  return (
    <section aria-labelledby="brands-heading">
      <h2 id="brands-heading" className="mb-4 text-xl font-bold md:text-2xl">
        {title ?? "Shop by brand"}
      </h2>

      {/* Toolbar: search + segment tabs */}
      <div className="mb-6 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Find a brand</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a brand"
            autoComplete="off"
            className="h-10 w-full rounded-full border bg-white pl-9 pr-4 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
          />
        </label>
        <div
          role="tablist"
          aria-label="Vehicle segment"
          className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1"
        >
          {[
            { value: "all" as Tab, label: "All" },
            ...SEGMENTS.map((s) => ({ value: s.value as Tab, label: s.label })),
          ].map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t.value
                  ? "bg-neutral-900 text-white shadow"
                  : "text-neutral-600 hover:text-neutral-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {query ? (
            <>
              No brands match <span className="font-medium text-foreground">“{query}”</span>.
            </>
          ) : (
            "No brands in this segment yet."
          )}
        </p>
      ) : (
        <ul
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4",
            compact ? "lg:grid-cols-6" : "lg:grid-cols-5",
          )}
        >
          {list.map((b) => (
            <li key={b.id}>
              <Link
                href={`/products?brand=${b.slug}${tab !== "all" ? `&segment=${tab}` : ""}`}
                className="group relative flex aspect-square flex-col items-center rounded-2xl border bg-white px-3 pb-5 pt-8 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 sm:aspect-[4/5] sm:px-4 sm:pt-10"
                aria-label={`${b.name} accessories`}
              >
                {/* Segment badge (top-left, like a country flag) */}
                <span
                  className="absolute left-3 top-3 flex items-center gap-1"
                  title={b.segments
                    .map((s) => SEGMENTS.find((x) => x.value === s)?.label ?? s)
                    .join(" · ")}
                >
                  {b.segments.map((s) => {
                    const Icon = SEGMENT_ICON[s];
                    return (
                      <span
                        key={s}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 ring-1 ring-black/5"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    );
                  })}
                </span>

                {/* Logo */}
                <div className="relative flex w-full flex-1 items-center justify-center">
                  {b.logoUrl ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={b.logoUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-3xl font-black text-neutral-400 transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24 sm:text-4xl">
                      {b.name[0]}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span className="mt-4 line-clamp-2 text-center text-sm font-semibold leading-tight text-neutral-900 sm:text-base">
                  {b.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
