import Image from "next/image";
import Link from "next/link";
import { Bike, Car, CircleArrowRight, Truck } from "lucide-react";
import { SectionHeading } from "./section-heading";

const CATEGORIES = [
  { href: "/products?segment=two_wheeler", label: "2 Wheeler", sub: "Bikes • Scooters • EV", image: "/home/category-2-wheeler.webp", icon: Bike },
  { href: "/products?segment=four_wheeler", label: "4 Wheeler", sub: "Cars • SUVs • MUVs", image: "/home/category-4-wheeler.webp", icon: Car },
  { href: "/products?segment=truck", label: "Truck", sub: "LCV • HCV • Bus", image: "/home/category-truck.webp", icon: Truck },
];

export function CategoryCards() {
  return (
    <section className="container pt-10 md:pt-12" aria-labelledby="cat-h">
      <SectionHeading id="cat-h" title="Shop by Vehicle Category" subtitle="Wide range of accessories for all vehicles" />
      <div className="grid gap-3.5 md:grid-cols-3 md:gap-[18px]">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative block h-[170px] overflow-hidden rounded-lg text-white md:h-[204px]"
          >
            <Image
              src={c.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              // The placeholder photos were cropped from the mockup and carry its label text in the bottom third;
              // anchor to the top and zoom slightly so that strip stays out of view. Replace with clean photos later.
              className="origin-top scale-[1.42] object-cover object-top transition-transform duration-500 group-hover:scale-[1.48]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0c0f]/90" />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3.5 px-5 py-4 md:px-[22px]">
              <c.icon className="h-10 w-10 shrink-0 md:h-[46px] md:w-[46px]" strokeWidth={1.75} />
              <span className="flex flex-1 flex-col">
                <b className="font-display text-lg font-bold md:text-[19px]">{c.label}</b>
                <span className="text-xs text-neutral-200">{c.sub}</span>
              </span>
              <CircleArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
