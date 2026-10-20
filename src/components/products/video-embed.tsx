import { youtubeId } from "@/lib/utils";

export function VideoEmbed({ kind, url, title }: { kind: string; url: string; title: string }) {
  if (kind === "upload") {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-black"
        title={title}
      />
    );
  }
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <iframe
      className="aspect-video w-full rounded-xl"
      src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
