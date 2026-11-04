"use client";
import { useEffect, useState } from "react";
import { Quote, ShieldCheck } from "lucide-react";
import type { Testimonial } from "@/lib/catalogue";
import { StarRating } from "@/components/ui/star-rating";
import { cn, initials } from "@/lib/utils";

/** Rotating customer reviews. With no approved reviews yet it shows the store promise instead. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % items.length), 7000);
    return () => window.clearInterval(id);
  }, [items.length]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="border-l-4 border-brand pl-2.5 font-display text-xl font-bold leading-tight">What Our Customers Say</h2>
        <p className="mt-1.5 pl-3.5 text-[13px] text-neutral-700">Trusted by riders, drivers and fleet owners</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col gap-4 rounded-lg bg-neutral-100 px-6 py-6">
          <div className="flex gap-4">
            <ShieldCheck className="h-8 w-8 shrink-0 text-brand" />
            <p className="text-sm leading-relaxed">
              Every part we sell is matched to your exact make, model and year, delivered pan-India, with UPI, cards and cash on
              delivery. Reviews from verified buyers will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative min-h-[150px]">
            {items.map((t, idx) => (
              <figure
                key={t.id}
                className={cn(
                  "flex flex-col gap-4 rounded-lg bg-neutral-100 px-6 py-5 transition-opacity duration-500",
                  idx === i ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
                )}
                aria-hidden={idx !== i}
              >
                <blockquote className="flex gap-4">
                  <Quote className="h-8 w-8 shrink-0 text-brand" />
                  <p className="text-sm leading-relaxed">{t.quote}</p>
                </blockquote>
                <figcaption className="flex items-center gap-4 pl-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-300 text-sm font-semibold text-neutral-700">
                    {initials(t.name)}
                  </span>
                  <span>
                    <b className="block text-sm font-semibold">{t.name}</b>
                    <span className="text-xs text-muted-foreground">{t.meta}</span>
                  </span>
                  <StarRating value={t.rating} className="ml-auto" />
                </figcaption>
              </figure>
            ))}
          </div>
          {items.length > 1 && (
            <div className="flex justify-center gap-2" role="tablist" aria-label="Reviews">
              {items.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === i}
                  aria-label={`Review ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={cn("h-2.5 w-2.5 rounded-full", idx === i ? "bg-brand" : "bg-neutral-300 hover:bg-neutral-400")}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
