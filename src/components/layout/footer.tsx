import Link from "next/link";
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import {
  InstagramIcon as Instagram,
  YoutubeIcon as Youtube,
  FacebookIcon as Facebook,
} from "@/components/shared/brand-icons";
import type { SiteSettingsPlain } from "@/lib/settings";
import { Wordmark } from "./wordmark";

export function Footer({ settings: s }: { settings: SiteSettingsPlain }) {
  return (
    <footer className="mt-12 bg-ink text-neutral-200" id="footer">
      <div className="container grid gap-8 pb-8 pt-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_1.1fr_1.3fr_0.9fr] lg:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <Wordmark name={s.storeName} logoUrl={s.logoUrl} className="text-white" />
          <p className="mt-3 max-w-sm text-sm">{s.tagline}</p>
          <div className="mt-4 flex gap-3">
            {s.facebookUrl && <Social href={s.facebookUrl} label="Facebook"><Facebook className="h-4 w-4" /></Social>}
            {s.instagramUrl && <Social href={s.instagramUrl} label="Instagram"><Instagram className="h-4 w-4" /></Social>}
            {s.youtubeUrl && <Social href={s.youtubeUrl} label="YouTube"><Youtube className="h-4 w-4" /></Social>}
          </div>
        </div>
        <FootCol title="Quick Links">
          <FootLink href="/">Home</FootLink>
          <FootLink href="/products">Products</FootLink>
          <FootLink href="/about">About Us</FootLink>
          <FootLink href="/contact">Contact Us</FootLink>
        </FootCol>
        <FootCol title="Shop">
          <FootLink href="/products?segment=two_wheeler">2 Wheeler Accessories</FootLink>
          <FootLink href="/products?segment=four_wheeler">4 Wheeler Accessories</FootLink>
          <FootLink href="/products?segment=truck">Truck Accessories</FootLink>
          <FootLink href="/orders">Track My Order</FootLink>
        </FootCol>
        <FootCol title="Contact Us">
          {s.contactPhone && (
            <a href={`tel:${s.contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-white">
              <Phone className="h-4 w-4 shrink-0" /> {s.contactPhone}
            </a>
          )}
          {s.contactEmail && (
            <a href={`mailto:${s.contactEmail}`} className="flex items-center gap-3 hover:text-white">
              <Mail className="h-4 w-4 shrink-0" /> {s.contactEmail}
            </a>
          )}
          {(s.addressLine1 || s.city) && (
            <span className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{[s.addressLine1, s.addressLine2, s.city].filter(Boolean).join(", ")}</span>
            </span>
          )}
        </FootCol>
        <FootCol title="We Accept">
          <div className="flex flex-wrap gap-2.5">
            <Pay label="Visa"><span className="font-display text-[13px] font-extrabold italic tracking-tight text-[#1A1F71]">VISA</span></Pay>
            <Pay label="Mastercard">
              <span className="flex -space-x-2">
                <span className="h-4 w-4 rounded-full bg-[#EB001B]" />
                <span className="h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
              </span>
            </Pay>
            <Pay label="UPI"><span className="font-display text-[12px] font-extrabold text-[#097939]">UPI</span></Pay>
          </div>
          <span className="text-xs text-neutral-400">Cash on delivery available</span>
        </FootCol>
      </div>
      <div className="relative border-t border-[#2C3038]">
        <div className="container flex min-h-[54px] flex-col items-center justify-between gap-2 py-3 text-[13px] text-neutral-300 sm:flex-row">
          <span>© {new Date().getFullYear()} {s.storeName}. All Rights Reserved.</span>
          <span>Secure payments via Razorpay</span>
        </div>
        <a
          href="#main"
          aria-label="Back to top"
          className="absolute right-6 -top-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
        >
          <ArrowUp className="h-4 w-4" />
        </a>
      </div>
    </footer>
  );
}

function FootCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <h3 className="font-display text-[15px] font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}
function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-white">
      {children}
    </Link>
  );
}
function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#262A31] hover:bg-brand"
    >
      {children}
    </a>
  );
}
function Pay({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex h-[34px] w-14 items-center justify-center rounded bg-white" title={label} aria-label={label}>
      {children}
    </span>
  );
}
