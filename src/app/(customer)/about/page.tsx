import type { Metadata } from "next";
import Image from "next/image";
import { WaitingCarScene } from "@/components/about/waiting-car";
import { MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { MarkdownPreview } from "@/components/shared/markdown";

export const metadata: Metadata = { title: "About us" };

export default async function AboutPage() {
  const s = await getSiteSettings();
  return (
    <div className="container max-w-5xl py-8 md:py-14">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">About</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">{s.storeName}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-600">{s.tagline}</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="story-h" className="rounded-2xl border bg-white p-6 md:p-8">
          <h2 id="story-h" className="text-xl font-bold">
            Our story
          </h2>
          <div className="mt-3">
            <MarkdownPreview content={s.aboutStory || "_Our story is being written — check back soon._"} />
          </div>
        </section>
        <section aria-labelledby="mission-h" className="rounded-2xl bg-neutral-950 p-6 text-white md:p-8">
          <h2 id="mission-h" className="text-xl font-bold">
            Our mission
          </h2>
          <div className="mt-3 [&_.prose-store]:text-neutral-300 [&_strong]:text-white">
            <MarkdownPreview content={s.aboutMission || "_Coming soon._"} />
          </div>
        </section>
      </div>

      {s.aboutGallery.length > 0 && (
        <section aria-labelledby="gallery-h" className="mt-12">
          <h2 id="gallery-h" className="mb-4 text-xl font-bold">
            Gallery
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {s.aboutGallery.map((url, i) => (
              <li
                key={url + i}
                className={`relative overflow-hidden rounded-xl bg-neutral-100 ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
              >
                <Image
                  src={url}
                  alt={`${s.storeName} photo ${i + 1}`}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  className="object-cover transition-transform hover:scale-105"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="map-h" className="mt-12">
        <h2 id="map-h" className="mb-4 flex items-center gap-2 text-xl font-bold">
          <MapPin className="h-5 w-5" /> Find us
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col overflow-hidden rounded-xl border bg-white text-sm text-neutral-700">
            <div className="p-5">
              <div className="font-semibold text-neutral-900">{s.storeName}</div>
              {s.addressLine1 && <div>{s.addressLine1}</div>}
              {s.addressLine2 && <div>{s.addressLine2}</div>}
              {s.city && <div>{s.city}</div>}
              {s.contactPhone && <div className="mt-2">📞 {s.contactPhone}</div>}
              {s.contactEmail && <div>✉️ {s.contactEmail}</div>}
            </div>
            <WaitingCarScene className="mt-auto block w-full" />
          </div>
          <div className="overflow-hidden rounded-xl border md:col-span-2">
            {s.mapEmbedUrl ? (
              <iframe
                src={s.mapEmbedUrl}
                title="Store location map"
                className="h-72 w-full md:h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-neutral-100 text-sm text-muted-foreground">
                Map coming soon
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
