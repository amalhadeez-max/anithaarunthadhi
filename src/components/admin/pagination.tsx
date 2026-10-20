import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (p: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
      <span className="text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <Link href={makeHref(Math.max(1, page - 1))}>
            <ChevronLeft /> Prev
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-disabled={page >= pageCount}
          className={page >= pageCount ? "pointer-events-none opacity-50" : ""}
        >
          <Link href={makeHref(Math.min(pageCount, page + 1))}>
            Next <ChevronRight />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
