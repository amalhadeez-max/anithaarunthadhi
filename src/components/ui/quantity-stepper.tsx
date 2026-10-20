"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

export function QuantityStepper({
  value,
  onChange,
  max = MAX_QTY_PER_LINE,
  min = 1,
  size = "md",
  className,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  const w = size === "sm" ? "w-8" : "w-10";
  const cap = Math.min(max, MAX_QTY_PER_LINE);
  return (
    <div
      className={cn("inline-flex items-center rounded-md border bg-white", h, className)}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-l-md text-neutral-700 hover:bg-neutral-100 disabled:opacity-40",
          h,
          w,
        )}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "min-w-8 text-center text-sm font-semibold tabular-nums",
          size === "sm" ? "px-1" : "px-2",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-r-md text-neutral-700 hover:bg-neutral-100 disabled:opacity-40",
          h,
          w,
        )}
        onClick={() => onChange(Math.min(cap, value + 1))}
        disabled={disabled || value >= cap}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
