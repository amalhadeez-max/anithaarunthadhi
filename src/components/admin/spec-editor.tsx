"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SpecEntry = { key: string; value: string };

export function SpecEditor({ value, onChange }: { value: SpecEntry[]; onChange: (v: SpecEntry[]) => void }) {
  const update = (i: number, patch: Partial<SpecEntry>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={s.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="Material"
            className="h-9 w-2/5"
            aria-label={`Spec ${i + 1} name`}
          />
          <Input
            value={s.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="ABS plastic"
            className="h-9 flex-1"
            aria-label={`Spec ${i + 1} value`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9 shrink-0 text-destructive"
            aria-label="Remove spec"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { key: "", value: "" }])}
      >
        <Plus /> Add specification
      </Button>
    </div>
  );
}
