"use client";
import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);
  const list = images.length ? images : [{ url: "", alt: name }];
  const current = list[Math.min(idx, list.length - 1)];

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-neutral-50"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {current.url ? (
          <Image
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn("object-cover transition-transform duration-200", hover && "md:scale-[1.6]")}
            style={hover ? { transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">No image</div>
        )}
        {current.url && (
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur"
            aria-label="Zoom image"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        )}
      </div>
      {list.length > 1 && (
        <ul
          className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-y-auto"
          aria-label="Thumbnails"
        >
          {list.map((img, i) => (
            <li key={img.url + i} className="shrink-0">
              <button
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Image ${i + 1}`}
                aria-current={i === idx}
                className={cn(
                  "relative h-16 w-16 overflow-hidden rounded-lg border-2 bg-white md:h-20 md:w-20",
                  i === idx ? "border-neutral-900" : "border-transparent hover:border-neutral-300",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-4xl bg-black p-0 [&>button]:text-white">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div className="relative aspect-square w-full">
            {current.url && (
              <Image
                src={current.url}
                alt={current.alt ?? name}
                fill
                sizes="100vw"
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
