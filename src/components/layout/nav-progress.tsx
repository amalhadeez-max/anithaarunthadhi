"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SteeringWheel } from "@/components/ui/steering-wheel";

const SAFETY_MS = 12_000;

/**
 * Instant feedback for client-side navigation. The App Router only swaps the page once the
 * new route has rendered on the server, which in dev can take seconds with no visual change.
 * We flip on as soon as an internal link is clicked and off when the URL actually changes.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Navigation committed → hide.
  useEffect(() => {
    setActive(false);
    window.clearTimeout(timer.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    const start = () => {
      setActive(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setActive(false), SAFETY_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // hash / same page
      start();
    };
    const onPop = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;
  return (
    <div aria-live="polite" aria-busy="true" className="pointer-events-none fixed inset-0 z-[100]">
      {/* top progress bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-neutral-200/60">
        <div className="animate-nav-bar h-full bg-primary shadow-[0_0_8px_rgba(0,0,0,0.25)]" />
      </div>
      {/* steering-wheel pill */}
      <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-white/95 px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg backdrop-blur sm:bottom-6">
        <SteeringWheel className="h-5 w-5" />
        Loading…
      </div>
    </div>
  );
}
