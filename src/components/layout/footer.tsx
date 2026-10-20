import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  InstagramIcon as Instagram,
  YoutubeIcon as Youtube,
  FacebookIcon as Facebook,
} from "@/components/shared/brand-icons";
import type { SiteSettingsPlain } from "@/lib/settings";
import { Wordmark } from "./wordmark";

export function Footer({ settings: s }: { settings: SiteSettingsPlain }) {
  return (
    <footer className="mt-16 border-t bg-neutral-950 text-neutral-300">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark name={s.storeName} logoUrl={s.logoUrl} className="text-white" />
          <p className="mt-3 max-w-md text-sm text-neutral-400">{s.tagline}</p>
          <div className="mt-4 flex gap-2">
            {s.youtubeUrl && (
              <Social href={s.youtubeUrl} label="YouTube">
                <Youtube className="h-4 w-4" />
              </Social>
            )}
            {s.instagramUrl && (
              <Social href={s.instagramUrl} label="Instagram">
                <Instagram className="h-4 w-4" />
              </Social>
            )}
            {s.facebookUrl && (
              <Social href={s.facebookUrl} label="Facebook">
                <Facebook className="h-4 w-4" />
              </Social>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/products?segment=two_wheeler" className="hover:text-white">
                2 Wheeler accessories
              </Link>
            </li>
            <li>
              <Link href="/products?segment=four_wheeler" className="hover:text-white">
                4 Wheeler accessories
              </Link>
            </li>
            <li>
              <Link href="/products?segment=truck" className="hover:text-white">
                Truck accessories
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-white">
                Track my order
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Reach us</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {s.contactPhone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={`tel:${s.contactPhone.replace(/\s/g, "")}`} className="hover:text-white">
                  {s.contactPhone}
                </a>
              </li>
            )}
            {s.contactEmail && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={`mailto:${s.contactEmail}`} className="hover:text-white">
                  {s.contactEmail}
                </a>
              </li>
            )}
            {(s.addressLine1 || s.city) && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{[s.addressLine1, s.addressLine2, s.city].filter(Boolean).join(", ")}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-neutral-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {s.storeName}. All rights reserved.
          </span>
          <span>Secure payments via Razorpay · Cash on delivery available</span>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 hover:border-white hover:text-white"
    >
      {children}
    </a>
  );
}
