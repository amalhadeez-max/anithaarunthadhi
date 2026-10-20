"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import type { ProductCard as ProductCardT } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { toggleWishlist } from "@/actions/wishlist";
import { setCartLine } from "@/actions/cart";
import { cn, formatINR, discountPercent } from "@/lib/utils";
import { effectivePrice } from "@/lib/pricing";
import { StarRating } from "@/components/ui/star-rating";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product: p, priority = false }: { product: ProductCardT; priority?: boolean }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.find((i) => i.productId === p.id)?.quantity ?? 0);
  const wished = useWishlistStore((s) => s.ids.includes(p.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const out = p.stock <= 0;
  const pct = discountPercent(p.price, p.discountPrice);

  function add() {
    addItem(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: p.stock,
      },
      qty,
    );
    void setCartLine(p.id, inCart + qty);
    setAdded(true);
    toast.success(`Added ${qty} × ${p.name}`, {
      action: { label: "View cart", onClick: () => (window.location.href = "/cart") },
    });
    setTimeout(() => setAdded(false), 1500);
  }

  function wish() {
    const now = toggle(p.id);
    void toggleWishlist(p.id, now);
    toast(now ? "Saved to wishlist" : "Removed from wishlist");
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/products/${p.slug}`}
        className="relative block aspect-square overflow-hidden bg-neutral-50"
        aria-label={p.name}
      >
        {p.imageUrl ? (
          <Image
            src={p.imageUrl}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              out && "opacity-60 grayscale",
            )}
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">No image</div>
        )}
        {out && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        )}
        {!out && pct > 0 && (
          <Badge variant="brand" className="absolute left-2 top-2">
            {pct}% off
          </Badge>
        )}
      </Link>
      <button
        type="button"
        onClick={wish}
        aria-pressed={wished}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur transition-colors hover:bg-white"
      >
        <Heart className={cn("h-[18px] w-[18px]", wished ? "fill-brand text-brand" : "text-neutral-700")} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{p.brandName}</p>
        <Link
          href={`/products/${p.slug}`}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
        >
          {p.name}
        </Link>
        <StarRating value={p.ratingAvg} count={p.ratingCount} size="xs" />
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-bold">{formatINR(effectivePrice(p))}</span>
          {p.discountPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatINR(p.price)}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <QuantityStepper value={qty} onChange={setQty} max={p.stock} size="sm" disabled={out} />
          <Button
            size="sm"
            className="h-8 flex-1"
            onClick={add}
            disabled={out}
            aria-label={`Add ${p.name} to cart`}
          >
            {added ? <Check /> : <ShoppingCart />} {added ? "Added" : "Add"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white">
      <div className="aspect-square animate-pulse bg-neutral-200/80" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-16 animate-pulse rounded bg-neutral-200/80" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200/80" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200/80" />
        <div className="h-5 w-20 animate-pulse rounded bg-neutral-200/80" />
        <div className="h-8 w-full animate-pulse rounded bg-neutral-200/80" />
      </div>
    </div>
  );
}
