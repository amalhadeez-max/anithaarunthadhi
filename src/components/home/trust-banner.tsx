import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Handshake, Settings, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "100% Quality Assured" },
  { icon: Settings, label: "Advanced Technology" },
  { icon: Handshake, label: "Customer Support" },
  { icon: Truck, label: "On-Time Delivery" },
];

export function TrustBanner() {
  return (
    <section className="mt-10 overflow-hidden bg-navy text-white md:mt-12" aria-label="Why shop with us">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <ul className="container grid flex-1 grid-cols-2 gap-y-6 py-8 sm:grid-cols-4 lg:py-0">
          {ITEMS.map((it, i) => (
            <li
              key={it.label}
              className={
                "flex flex-col items-center justify-center gap-3 text-center text-sm font-medium lg:h-[146px] " +
                (i < ITEMS.length - 1 ? "lg:border-r lg:border-[#3A404B]" : "")
              }
            >
              <it.icon className="h-9 w-9" strokeWidth={1.5} />
              {it.label}
            </li>
          ))}
        </ul>
        <div className="relative flex min-h-[146px] items-center overflow-hidden pl-16 pr-6 lg:w-[500px] lg:pl-24">
          <Image src="/home/banner-engine.webp" alt="" fill sizes="500px" className="object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy from-[55%] via-navy/40 to-transparent" />
          <span className="absolute bottom-0 left-7 top-0 w-1.5 -skew-x-[28deg] bg-brand" aria-hidden />
          <div className="relative flex flex-col items-start gap-3 py-6">
            <b className="font-display text-lg font-bold leading-tight md:text-xl">
              Your Trusted Partner
              <br />
              in Automotive Solutions
            </b>
            <Link
              href="/about"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              Know More <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
