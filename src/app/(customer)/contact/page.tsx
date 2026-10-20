import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";
import { ContactForm } from "@/components/contact/contact-form";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/brand-icons";
import { WhatsAppIcon } from "@/components/layout/whatsapp-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage() {
  const s = await getSiteSettings();
  const socials = [
    { href: s.youtubeUrl, label: "YouTube", Icon: YoutubeIcon },
    { href: s.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: s.facebookUrl, label: "Facebook", Icon: FacebookIcon },
  ].filter((x) => x.href);

  return (
    <div className="container py-8 md:py-14">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-black md:text-4xl">Contact Us</h1>
        <p className="max-w-lg text-sm text-neutral-600 md:text-base">
          Any question or remarks? Just write us a message!
        </p>
        <Button asChild variant="whatsapp" size="xl" className="mt-1 h-11 gap-2 px-6 text-sm">
          <a href={whatsappLink(s.whatsappNumber)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-5 w-5" /> Ask on WhatsApp
          </a>
        </Button>
      </header>

      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-neutral-200/60 ring-1 ring-neutral-200 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:p-3">
        {/* Left: black info panel */}
        <section
          className="relative overflow-hidden bg-neutral-950 p-8 text-white md:rounded-xl md:p-10"
          aria-labelledby="ci-h"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-neutral-800/70"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-16 right-16 h-32 w-32 rounded-full bg-neutral-700/60"
          />
          <div className="relative flex h-full flex-col">
            <h2 id="ci-h" className="text-2xl font-bold">
              Contact Information
            </h2>
            <p className="mt-1.5 text-sm text-neutral-400">Let&apos;s chat!</p>

            <ul className="mt-12 space-y-8 text-sm md:mt-20">
              {s.contactPhone && (
                <li className="flex items-center gap-5">
                  <Phone className="h-5 w-5 shrink-0" />
                  <a href={`tel:${s.contactPhone.replace(/\s/g, "")}`} className="hover:underline">
                    {s.contactPhone}
                  </a>
                </li>
              )}
              {s.contactEmail && (
                <li className="flex items-center gap-5">
                  <Mail className="h-5 w-5 shrink-0" />
                  <a href={`mailto:${s.contactEmail}`} className="hover:underline">
                    {s.contactEmail}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <address className="not-italic leading-6">
                  <div className="font-semibold">{s.storeName}</div>
                  {s.addressLine1 && <div>{s.addressLine1}</div>}
                  {s.addressLine2 && <div>{s.addressLine2}</div>}
                  {s.city && <div>{s.city}</div>}
                  {(s.altContactName || s.altContactPhone) && (
                    <div className="mt-2 text-neutral-300">
                      {[s.altContactName, s.altContactPhone].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </address>
              </li>
            </ul>

            <div className="mt-14 flex gap-3 md:mt-auto md:pt-14">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-600 text-white transition-colors hover:bg-white hover:text-neutral-950"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <a
                href={whatsappLink(s.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-600 text-white transition-colors hover:border-whatsapp hover:bg-whatsapp"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Right: form */}
        <section className="p-6 md:p-10" aria-label="Contact form">
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
