"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import type { ProductCard as ProductCardT } from "@/types";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/constants";

type Resp = { items: ProductCardT[]; total: number; page: number; pageCount: number };

export function ProductGrid({ initial }: { initial?: Resp }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qs = sp.toString();

  const { data, isLoading, isError, isFetching } = useQuery<Resp>({
    queryKey: ["products", qs],
    queryFn: async () => {
      const res = await fetch(`/api/products?${qs}`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    placeholderData: keepPreviousData,
    initialData: initial && initial.page === Number(sp.get("page") ?? 1) ? initial : undefined,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError)
    return (
      <EmptyState
        title="Couldn't load products"
        description="Please check your connection and try again."
        action={<Button onClick={() => router.refresh()}>Retry</Button>}
      />
    );
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch />}
        title="No products match"
        description="Try a different model, year or category — or clear the filters."
        action={
          <Button
            variant="outline"
            onClick={() => router.push(pathname + (sp.get("brand") ? `?brand=${sp.get("brand")}` : ""))}
          >
            Clear filters
          </Button>
        }
      />
    );
  }

  const goto = (p: number) => {
    const n = new URLSearchParams(qs);
    n.set("page", String(p));
    router.push(`${pathname}?${n.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}
      aria-busy={isFetching}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Showing {(data.page - 1) * PAGE_SIZE + 1}–{Math.min(data.page * PAGE_SIZE, data.total)} of{" "}
        {data.total}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {data.items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
      {data.pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => goto(data.page - 1)}>
            Previous
          </Button>
          <span className="px-2 text-sm">
            Page {data.page} of {data.pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.pageCount}
            onClick={() => goto(data.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
