"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Car, ChevronDown, Search } from "lucide-react";
import type { Segment } from "@prisma/client";
import type { BrandCard, ModelWithVariants } from "@/types";
import { SEGMENTS } from "@/lib/constants";

/** "Find the right product for your vehicle" bar: category → brand → model → year → /products. */
export function VehicleFinder({ brands }: { brands: BrandCard[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [segment, setSegment] = useState<"" | Segment>("");
  const [brand, setBrand] = useState("");
  const [models, setModels] = useState<ModelWithVariants[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const brandOptions = useMemo(
    () => (segment ? brands.filter((b) => b.segments.includes(segment)) : brands),
    [brands, segment],
  );

  // Load models whenever the brand changes.
  useEffect(() => {
    setModel("");
    setYear("");
    if (!brand) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setLoadingModels(true);
    fetch(`/api/variants?brand=${encodeURIComponent(brand)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ModelWithVariants[]) => {
        if (!cancelled) setModels(Array.isArray(data) ? data : []);
      })
      .catch(() => !cancelled && setModels([]))
      .finally(() => !cancelled && setLoadingModels(false));
    return () => {
      cancelled = true;
    };
  }, [brand]);

  const modelOptions = useMemo(
    () => (segment ? models.filter((m) => m.segment === segment) : models),
    [models, segment],
  );
  const years = useMemo(() => {
    const m = models.find((x) => x.id === model);
    return Array.from(new Set((m?.variants ?? []).map((v) => v.year))).sort((a, b) => b - a);
  }, [models, model]);

  function search() {
    const p = new URLSearchParams();
    if (brand) p.set("brand", brand);
    if (segment) p.set("segment", segment);
    if (model) p.set("model", model);
    if (year) p.set("year", year);
    start(() => router.push(`/products${p.size ? `?${p}` : ""}`));
  }

  return (
    <div className="container relative z-20 -mt-8 md:-mt-7">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-[0_10px_30px_rgba(20,23,28,0.12)] md:flex-nowrap md:gap-4 md:py-3.5 md:pl-6 md:pr-5"
        aria-label="Find products for your vehicle"
      >
        <div className="flex w-full items-center gap-4 md:w-auto md:min-w-[270px] md:pr-3">
          <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg bg-brand text-white md:h-[60px] md:w-[70px]">
            <Car className="h-7 w-7 md:h-9 md:w-9" />
          </span>
          <b className="font-display text-[15px] font-semibold leading-snug md:text-base">
            Find the Right Product
            <br />
            for Your Vehicle
          </b>
        </div>

        <Field label="Vehicle Category">
          <select value={segment} onChange={(e) => { setSegment(e.target.value as "" | Segment); setBrand(""); }} aria-label="Vehicle category">
            <option value="">Select Category</option>
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Brand">
          <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand">
            <option value="">Select Brand</option>
            {brandOptions.map((b) => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Model">
          <select value={model} onChange={(e) => { setModel(e.target.value); setYear(""); }} disabled={!brand || loadingModels} aria-label="Model">
            <option value="">{loadingModels ? "Loading…" : brand ? "Select Model" : "Pick a brand first"}</option>
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Year">
          <select value={year} onChange={(e) => setYear(e.target.value)} disabled={!model} aria-label="Year">
            <option value="">{model ? "Select Year" : "Pick a model first"}</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-70 md:h-[46px] md:w-auto"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="relative flex min-w-0 flex-1 basis-[calc(50%-6px)] flex-col gap-0.5 rounded-md border bg-neutral-50 px-3.5 py-2 md:basis-0">
      <span className="truncate whitespace-nowrap text-[13px] font-medium">{label}</span>
      <span className="relative block">
        <span className="[&>select]:w-full [&>select]:appearance-none [&>select]:bg-transparent [&>select]:pr-6 [&>select]:truncate [&>select]:text-[13px] [&>select]:text-neutral-600 [&>select]:outline-none [&>select:disabled]:text-neutral-400">
          {children}
        </span>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden />
      </span>
    </label>
  );
}
