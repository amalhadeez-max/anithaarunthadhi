"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Slide = {
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  image: string;
  imageClass?: string;
  /** "bleed": photo fills the right 62% (slide 1). "card": photo sits in a framed panel on the right. */
  layout?: "bleed" | "card";
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Automotive accessories",
    title: "Accessories for",
    highlight: "Every Ride",
    text: "Genuine and aftermarket parts for bikes, cars, SUVs and trucks — matched to your make, model and year.",
    primary: { label: "Shop Now", href: "/products" },
    secondary: { label: "Explore Products", href: "/products" },
    image: "/home/hero-injector.jpg",
    imageClass: "object-center",
  },
  {
    eyebrow: "Two wheelers",
    title: "Ride Safer,",
    highlight: "Ride Smarter",
    text: "Helmets, crash guards, covers and lighting for bikes, scooters and electric two-wheelers.",
    primary: { label: "Shop 2 Wheeler", href: "/products?segment=two_wheeler" },
    secondary: { label: "All Brands", href: "/products" },
    image: "/home/category-2-wheeler.webp",
    imageClass: "origin-top scale-[1.4] object-top", // placeholder crop carries mockup text in its bottom third
    layout: "card",
  },
  {
    eyebrow: "Four wheelers",
    title: "Genuine Parts,",
    highlight: "Perfect Fit",
    text: "Seat covers, mats, lamps and more for hatchbacks, sedans, SUVs and MUVs.",
    primary: { label: "Shop 4 Wheeler", href: "/products?segment=four_wheeler" },
    secondary: { label: "All Brands", href: "/products" },
    image: "/home/category-4-wheeler.webp",
    imageClass: "origin-top scale-[1.4] object-top", // placeholder crop carries mockup text in its bottom third
    layout: "card",
  },
  {
    eyebrow: "Trucks & commercial",
    title: "Built for the",
    highlight: "Long Haul",
    text: "Tarpaulins, tool boxes, mirrors and lighting for LCVs, HCVs and buses.",
    primary: { label: "Shop Truck", href: "/products?segment=truck" },
    secondary: { label: "All Brands", href: "/products" },
    image: "/home/category-truck.webp",
    imageClass: "origin-top scale-[1.4] object-top", // placeholder crop carries mockup text in its bottom third
    layout: "card",
  },
];

const INTERVAL = 6500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const go = useCallback((n: number) => setIndex((i) => (i + n + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused.current) go(1);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [go]);

  return (
    <section
      className="relative isolate h-[520px] overflow-hidden bg-navy text-white md:h-[440px] lg:h-[480px]"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {SLIDES.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.highlight}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              active ? "z-10 opacity-100" : "z-0 opacity-0",
            )}
            aria-hidden={!active}
          >
            {/* image: full-bleed on mobile; on desktop either bleeds into the right 62% or sits in a framed card */}
            <div
              className={cn(
                "absolute inset-0 overflow-hidden",
                s.layout === "card"
                  ? "md:inset-auto md:bottom-[11%] md:right-[5%] md:top-[11%] md:w-[44%] md:rounded-2xl md:shadow-[0_24px_60px_rgba(0,0,0,0.45)] md:ring-1 md:ring-white/10 lg:right-[6%] lg:w-[42%]"
                  : "md:left-auto md:right-0 md:w-[62%] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_22%,#000_92%,transparent_100%)]",
              )}
            >
              <Image
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes={s.layout === "card" ? "(max-width: 768px) 100vw, 44vw" : "(max-width: 768px) 100vw, 62vw"}
                className={cn("object-cover", s.imageClass)}
              />
            </div>
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20",
                s.layout === "card" ? "md:bg-none" : "md:bg-gradient-to-r md:from-navy md:via-navy/60 md:to-transparent",
              )}
            />

            <div className="container relative flex h-full items-end pb-24 md:items-center md:pb-0 md:pl-14">
              <div className="flex max-w-[560px] flex-col gap-4 md:gap-5">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] md:text-sm">
                  {s.eyebrow}
                  <span className="block h-0.5 w-10 bg-brand" aria-hidden />
                </div>
                <h1 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-5xl lg:text-6xl">
                  {s.title}
                  <span className="block text-brand">{s.highlight}</span>
                </h1>
                <p className="max-w-[420px] text-base text-neutral-200 md:text-xl">{s.text}</p>
                <div className="mt-1 flex flex-wrap gap-3 md:gap-4">
                  <Link
                    href={s.primary.href}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark md:px-7 md:text-[15px]"
                    tabIndex={active ? 0 : -1}
                  >
                    {s.primary.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={s.secondary.href}
                    className="inline-flex h-11 items-center rounded-full border-2 border-white px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-ink md:px-7 md:text-[15px]"
                    tabIndex={active ? 0 : -1}
                  >
                    {s.secondary.label}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* arrows */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="absolute left-5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/25 text-white transition-colors hover:bg-white hover:text-ink md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-5 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/25 text-white transition-colors hover:bg-white hover:text-ink md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* dots */}
      <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-10" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.highlight}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn("h-2.5 w-2.5 rounded-full transition-colors", i === index ? "bg-brand" : "bg-white/90 hover:bg-white")}
          />
        ))}
      </div>
    </section>
  );
}
