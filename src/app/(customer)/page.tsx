import Link from "next/link";
import { Bike, Car, Truck, ShieldCheck, Truck as Delivery, BadgeIndianRupee } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { getActiveBrands } from "@/lib/catalogue";
import { HeroVideo } from "@/components/home/hero-video";
import { BrandGrid } from "@/components/home/brand-grid";

export default async function HomePage() {
  const [s, brands] = await Promise.all([getSiteSettings(), getActiveBrands().catch(() => [])]);
  return (
    <>
      <HeroVideo
        storeName={s.storeName}
        tagline={s.tagline}
        videoUrl={s.heroVideoUrl}
        youtubeUrl={s.heroYoutubeUrl}
      />

      {/* About strip */}
      <section className="border-b bg-white">
        <div className="container grid gap-6 py-10 md:grid-cols-3 md:items-center md:py-14">
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold md:text-2xl">Welcome to {s.storeName}</h2>
            <p className="mt-2 text-[15px] leading-7 text-neutral-600">
              {s.homeDescription ||
                "Genuine and aftermarket accessories for two-wheelers, cars, SUVs and commercial vehicles — matched to your exact make, model and year."}
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-neutral-700 md:grid-cols-1 md:text-left md:text-sm">
            <li className="flex flex-col items-center gap-1.5 rounded-lg bg-neutral-50 p-3 md:flex-row md:gap-3">
              <ShieldCheck className="h-5 w-5 text-brand" /> Fit-guaranteed parts
            </li>
            <li className="flex flex-col items-center gap-1.5 rounded-lg bg-neutral-50 p-3 md:flex-row md:gap-3">
              <Delivery className="h-5 w-5 text-brand" /> Pan-India delivery
            </li>
            <li className="flex flex-col items-center gap-1.5 rounded-lg bg-neutral-50 p-3 md:flex-row md:gap-3">
              <BadgeIndianRupee className="h-5 w-5 text-brand" /> UPI, cards & COD
            </li>
          </ul>
        </div>
      </section>

      {/* Segment shortcuts */}
      <section className="container py-8 md:py-10">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            {
              href: "/products?segment=two_wheeler",
              label: "2 Wheeler",
              sub: "Bikes · Scooters · EV",
              icon: Bike,
            },
            {
              href: "/products?segment=four_wheeler",
              label: "4 Wheeler",
              sub: "Cars · SUVs · MUVs",
              icon: Car,
            },
            { href: "/products?segment=truck", label: "Truck", sub: "LCV · HCV · Bus", icon: Truck },
          ].map((seg) => (
            <Link
              key={seg.href}
              href={seg.href}
              className="group flex flex-col items-center gap-1.5 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:gap-4 sm:text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white group-hover:bg-brand">
                <seg.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold sm:text-base">{seg.label}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{seg.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Brands grid */}
      <section className="container pb-12">
        <BrandGrid brands={brands} />
      </section>
    </>
  );
}
