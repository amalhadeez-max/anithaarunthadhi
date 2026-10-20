import { cn } from "@/lib/utils";

/**
 * Spinning steering-wheel loader (pure SVG + CSS, no runtime dependency).
 * Size with `className` (e.g. "h-10 w-10"); colour follows `currentColor`.
 */
export function SteeringWheel({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      role="img"
      aria-label={label}
      className={cn("animate-steer", className)}
    >
      {/* rim */}
      <circle cx="24" cy="24" r="20" />
      {/* inner rim shading */}
      <circle cx="24" cy="24" r="14" strokeWidth="1.5" opacity="0.35" />
      {/* hub */}
      <circle cx="24" cy="24" r="4.5" fill="currentColor" stroke="none" />
      {/* spokes: 90°, 210°, 330° */}
      <path d="M24 28.5V38" />
      <path d="M20.1 21.75 11.9 17" />
      <path d="M27.9 21.75 36.1 17" />
    </svg>
  );
}

/** Centred full-area loader used by route `loading.tsx` files. */
export function PageLoader({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-neutral-500" aria-busy="true">
      <SteeringWheel className="h-12 w-12 text-neutral-800" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
