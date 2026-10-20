"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Folder = "brands" | "models" | "products" | "videos" | "settings" | "reviews" | "avatars";

export async function uploadFile(file: File, folder: Folder): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
  return json.url;
}

/**
 * Multi-image uploader: uploads to Supabase Storage through /api/upload and returns public URLs.
 * Also accepts pasting an external URL (handy while Supabase isn't configured yet).
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  max = 10,
  label = "Upload images",
  compact = false,
  accept = "image/*",
  allowUrl = true,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: Folder;
  max?: number;
  label?: string;
  compact?: boolean;
  accept?: string;
  allowUrl?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = max - value.length;
    if (room <= 0) return toast.error(`Maximum ${max} file${max > 1 ? "s" : ""}`);
    setBusy(true);
    try {
      const picked = Array.from(files).slice(0, room);
      const urls: string[] = [];
      for (const f of picked) urls.push(await uploadFile(f, folder));
      onChange(max === 1 ? urls.slice(0, 1) : [...value, ...urls]);
      toast.success(`${urls.length} file${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addUrl() {
    try {
      const u = new URL(url.trim());
      onChange(max === 1 ? [u.toString()] : [...value, u.toString()].slice(0, max));
      setUrl("");
      setUrlMode(false);
    } catch {
      toast.error("Enter a valid URL");
    }
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {!compact && value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <li key={`${src}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-md border bg-white">
              {/\.(mp4|webm)(\?|$)/i.test(src) ? (
                <video src={src} className="h-full w-full object-cover" muted />
              ) : (
                <Image src={src} alt="" fill sizes="80px" className="object-cover" unoptimized />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={cn("flex flex-wrap items-center gap-2")}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={max > 1}
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy || value.length >= max}
        >
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} {label}
        </Button>
        {allowUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUrlMode((v) => !v)}
            disabled={value.length >= max}
          >
            <Link2 /> Paste URL
          </Button>
        )}
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {value.length}/{max}
          </span>
        )}
      </div>
      {urlMode && (
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="h-9"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          />
          <Button type="button" size="sm" onClick={addUrl}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
