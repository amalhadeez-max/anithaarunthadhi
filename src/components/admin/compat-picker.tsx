"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ModelWithVariants } from "@/types";
import { VEHICLE_TYPE_LABEL } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

/** Multi-select of vehicle variants (model → type → years) for a chosen brand. */
export function CompatPicker({
  brandId,
  value,
  onChange,
}: {
  brandId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [filter, setFilter] = useState("");
  const { data, isLoading } = useQuery<ModelWithVariants[]>({
    queryKey: ["variants", brandId],
    queryFn: async () => (await fetch(`/api/variants?brandId=${brandId}`)).json(),
    enabled: Boolean(brandId),
  });
  const selected = useMemo(() => new Set(value), [value]);

  if (!brandId) return <p className="text-sm text-muted-foreground">Choose a brand first.</p>;
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!data?.length)
    return (
      <p className="text-sm text-muted-foreground">
        This brand has no models/variants yet. Add them under Vehicle Variants.
      </p>
    );

  const models = data.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()));

  const toggleMany = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    onChange([...next]);
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter models…"
          className="h-9"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{value.length} selected</span>
        {value.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {models.map((m) => {
          const byType = m.variants.reduce<Record<string, typeof m.variants>>(
            (acc, v) => ((acc[v.vehicleType] ??= []).push(v), acc),
            {},
          );
          const allIds = m.variants.map((v) => v.id);
          const allOn = allIds.length > 0 && allIds.every((id) => selected.has(id));
          return (
            <div key={m.id} className="rounded-md bg-neutral-50 p-2">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Checkbox checked={allOn} onCheckedChange={(c) => toggleMany(allIds, Boolean(c))} />
                {m.name}
                <span className="text-xs font-normal text-muted-foreground">({m.variants.length})</span>
              </label>
              {Object.entries(byType).map(([type, vs]) => {
                const ids = vs.map((v) => v.id);
                const on = ids.every((id) => selected.has(id));
                return (
                  <div key={type} className="ml-6 mt-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                      <Checkbox checked={on} onCheckedChange={(c) => toggleMany(ids, Boolean(c))} />
                      {VEHICLE_TYPE_LABEL[type as keyof typeof VEHICLE_TYPE_LABEL]} — all years
                    </label>
                    <div className="ml-6 mt-1 flex flex-wrap gap-1">
                      {vs
                        .sort((a, b) => a.year - b.year)
                        .map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => toggleMany([v.id], !selected.has(v.id))}
                            aria-pressed={selected.has(v.id)}
                            className={`rounded border px-1.5 py-0.5 text-xs tabular-nums ${selected.has(v.id) ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}
                          >
                            {v.year}
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
