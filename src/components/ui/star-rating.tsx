"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  count,
  size = "sm",
  onChange,
  className,
  showValue = false,
}: {
  value: number;
  count?: number;
  size?: "xs" | "sm" | "md" | "lg";
  onChange?: (v: number) => void;
  className?: string;
  showValue?: boolean;
}) {
  const px = { xs: "h-3 w-3", sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" }[size];
  const interactive = Boolean(onChange);
  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating" : `${value.toFixed(1)} out of 5 stars`}
    >
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = value >= i - 0.25;
          const half = !filled && value >= i - 0.75;
          const Icon = (
            <Star
              className={cn(
                px,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                    ? "fill-amber-200 text-amber-400"
                    : "fill-neutral-200 text-neutral-200",
              )}
              aria-hidden
            />
          );
          return interactive ? (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === i}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              onClick={() => onChange?.(i)}
              className="rounded transition-transform hover:scale-110 focus-visible:ring-2"
            >
              {Icon}
            </button>
          ) : (
            <span key={i}>{Icon}</span>
          );
        })}
      </div>
      {showValue ? <span className="text-xs font-medium text-neutral-700">{value.toFixed(1)}</span> : null}
      {count !== undefined ? <span className="text-xs text-muted-foreground">({count})</span> : null}
    </div>
  );
}
