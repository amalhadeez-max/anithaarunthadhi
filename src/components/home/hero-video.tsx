"use client";
import { useState } from "react";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { youtubeId } from "@/lib/utils";

/**
 * Full-width, auto-playing, muted, looping "Shorts"-style hero. Uses an uploaded MP4 when
 * available, otherwise falls back to a YouTube embed (autoplay+mute+loop).
 */
export function HeroVideo({
  storeName,
  tagline,
  videoUrl,
  youtubeUrl,
}: {
  storeName: string;
  tagline: string;
  videoUrl: string | null;
  youtubeUrl: string | null;
}) {
  const [muted, setMuted] = useState(true);
  const ytId = youtubeId(youtubeUrl);
  const hasMp4 = Boolean(videoUrl);

  return (
    <section
      className="relative isolate h-[78vh] min-h-[520px] w-full overflow-hidden bg-neutral-950 text-white md:h-[80vh]"
      aria-label="Featured"
    >
      {hasMp4 ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl!}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      ) : ytId ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Oversized iframe so a 9:16 short covers the hero on every viewport */}
          <iframe
            className="absolute left-1/2 top-1/2 aspect-[9/16] h-[max(100%,177.78vw)] w-auto min-w-full -translate-x-1/2 -translate-y-1/2 md:aspect-video md:h-[max(100%,56.25vw)]"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`}
            title="Store video"
            allow="autoplay; encrypted-media"
            loading="eager"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3f3f46,_#0a0a0a)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end px-4 pb-14 text-center md:pb-20">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          Bikes · Cars · Trucks
        </p>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight drop-shadow-lg sm:text-5xl md:text-6xl">
          {storeName}
        </h1>
        <p className="mt-3 max-w-xl text-base text-white/85 md:text-lg">{tagline}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="xl" variant="brand" className="shadow-xl shadow-brand/30">
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button
            asChild
            size="xl"
            variant="outline"
            className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <Link href="/about">Our story</Link>
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 md:bottom-6 md:right-6"
        aria-label={muted ? "Unmute video" : "Mute video"}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </section>
  );
}
