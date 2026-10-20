"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import type { Segment, VehicleType } from "@prisma/client";
import type { ModelWithVariants } from "@/types";
import { SEGMENTS, VEHICLE_TYPES_BY_SEGMENT, VEHICLE_TYPE_LABEL } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; segment: Segment | null };

const ANY = "any";

export function ProductFilters({
  brandSlug,
  brandSegments,
  categories,
  variant = "bar",
}: {
  brandSlug: string | null;
  brandSegments: Segment[];
  categories: Category[];
  variant?: "bar" | "sidebar";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const get = (k: string) => sp.get(k) ?? "";
  const segment = (get("segment") || (brandSegments.length === 1 ? brandSegments[0] : "")) as Segment | "";
  const model = get("model");
  const year = get("year");
  const type = get("type") as VehicleType | "";
  const category = get("category");
  const sort = get("sort") || "newest";
  const [minPrice, setMinPrice] = useState(get("minPrice"));
  const [maxPrice, setMaxPrice] = useState(get("maxPrice"));

  const { data: models, isLoading } = useQuery<ModelWithVariants[]>({
    queryKey: ["variants", "slug", brandSlug],
    queryFn: async () => (await fetch(`/api/variants?brand=${brandSlug}`)).json(),
    enabled: Boolean(brandSlug),
  });

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const n = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v && v !== ANY) n.set(k, v);
        else n.delete(k);
      }
      n.delete("page");
      router.push(`${pathname}?${n.toString()}`, { scroll: false });
    },
    [sp, router, pathname],
  );

  const visibleModels = useMemo(
    () => (models ?? []).filter((m) => !segment || m.segment === segment),
    [models, segment],
  );
  const selectedModel = visibleModels.find((m) => m.id === model);
  const years = useMemo(() => {
    const src = selectedModel ? selectedModel.variants : visibleModels.flatMap((m) => m.variants);
    return [...new Set(src.filter((v) => !type || v.vehicleType === type).map((v) => v.year))].sort(
      (a, b) => b - a,
    );
  }, [selectedModel, visibleModels, type]);
  const types = useMemo<VehicleType[]>(() => {
    if (segment) return VEHICLE_TYPES_BY_SEGMENT[segment];
    const src = selectedModel ? selectedModel.variants : (models ?? []).flatMap((m) => m.variants);
    return [...new Set(src.map((v) => v.vehicleType))];
  }, [segment, selectedModel, models]);
  const visibleCategories = categories.filter((c) => !segment || !c.segment || c.segment === segment);

  const activeCount = ["model", "year", "type", "category", "minPrice", "maxPrice", "segment"].filter((k) =>
    sp.get(k),
  ).length;

  const body = (
    <div className="space-y-5">
      <Field label="Vehicle segment">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: ANY, label: "All" },
            ...SEGMENTS.filter((s) => brandSegments.length === 0 || brandSegments.includes(s.value)),
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => update({ segment: s.value, model: undefined, year: undefined, type: undefined })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                (segment || ANY) === s.value
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "bg-white hover:bg-neutral-50",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      {brandSlug && (
        <Field label="Vehicle model">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={model || ANY} onValueChange={(v) => update({ model: v, year: undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="Any model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any model</SelectItem>
                {visibleModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <Select value={year || ANY} onValueChange={(v) => update({ year: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any year</SelectItem>
              {(years.length
                ? years
                : Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + 1 - i)
              ).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Vehicle type">
          <Select value={type || ANY} onValueChange={(v) => update({ type: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any type</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {VEHICLE_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Category">
        <Select value={category || ANY} onValueChange={(v) => update({ category: v })}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            {visibleCategories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Price range (₹)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined });
          }}
        >
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-label="Minimum price"
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="Maximum price"
            className="h-9"
          />
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Go
          </Button>
        </form>
      </Field>

      {activeCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setMinPrice("");
            setMaxPrice("");
            update({
              segment: undefined,
              model: undefined,
              year: undefined,
              type: undefined,
              category: undefined,
              minPrice: undefined,
              maxPrice: undefined,
            });
          }}
        >
          <X /> Clear filters
        </Button>
      )}
    </div>
  );

  if (variant === "sidebar") {
    return (
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </h2>
        {body}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="lg:hidden">
            <SlidersHorizontal /> Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-neutral-900 px-1.5 text-[10px] text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-2">
        <Label htmlFor="sort" className="hidden text-xs text-muted-foreground sm:block">
          Sort
        </Label>
        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger id="sort" className="h-9 w-44 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
      {children}
    </div>
  );
}
