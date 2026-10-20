import Image from "next/image";
import { cn } from "@/lib/utils";

export function Wordmark({
  name,
  logoUrl,
  className,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (logoUrl) {
    const h = size === "lg" ? 48 : size === "sm" ? 28 : 36;
    return (
      <Image
        src={logoUrl}
        alt={name}
        height={h}
        width={h * 4}
        className={cn(
          "h-auto w-auto object-contain",
          size === "lg" ? "max-h-12" : size === "sm" ? "max-h-7" : "max-h-9",
          className,
        )}
        priority
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0.5 font-black tracking-tight",
        size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl md:text-2xl",
        className,
      )}
    >
      <span>{name}</span>
      <span className="inline-block h-2 w-2 rounded-full bg-brand" aria-hidden />
    </span>
  );
}
