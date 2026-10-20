"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We hit an unexpected error. Please try again — if it keeps happening, message us on WhatsApp.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-neutral-400">Ref: {error.digest}</p> : null}
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
