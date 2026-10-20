"use client";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { setCartLine, syncCart } from "@/actions/cart";
import { computeTotals, effectivePrice } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceSummary } from "./price-summary";

export function CartView({
  rules,
  signedIn,
}: {
  rules: { deliveryCharge: number; freeDeliveryThreshold: number };
  signedIn: boolean;
}) {
  const { items, hydrated, setQuantity, removeItem, replace } = useCartStore();
  const router = useRouter();
  const totals = useMemo(() => computeTotals(items, rules), [items, rules]);

  // Refresh price/stock from the server when the page opens
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    syncCart(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
      .then(replace)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart />}
        title="Your cart is empty"
        description="Browse accessories for your bike, car or truck and add them here."
        action={
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        }
      />
    );
  }

  const outOfStock = items.filter((i) => i.stock <= 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <ul className="space-y-3 lg:col-span-2">
        {items.map((it) => {
          const unit = effectivePrice(it);
          const out = it.stock <= 0;
          return (
            <li key={it.productId} className="flex gap-3 rounded-xl border bg-white p-3 sm:gap-4 sm:p-4">
              <Link
                href={`/products/${it.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-neutral-50 sm:h-28 sm:w-28"
              >
                {it.imageUrl && (
                  <Image src={it.imageUrl} alt={it.name} fill sizes="112px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/products/${it.slug}`}
                  className="line-clamp-2 text-sm font-semibold hover:underline sm:text-base"
                >
                  {it.name}
                </Link>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-bold">{formatINR(unit)}</span>
                  {it.discountPrice && (
                    <span className="text-xs text-muted-foreground line-through">{formatINR(it.price)}</span>
                  )}
                </div>
                {out ? (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    Out of stock — remove to continue
                  </p>
                ) : it.quantity >= it.stock ? (
                  <p className="mt-1 text-xs text-amber-600">Max available: {it.stock}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <QuantityStepper
                    size="sm"
                    value={it.quantity}
                    max={it.stock}
                    disabled={out}
                    onChange={(q) => {
                      setQuantity(it.productId, q);
                      if (signedIn) void setCartLine(it.productId, q);
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatINR(unit * it.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        removeItem(it.productId);
                        if (signedIn) void setCartLine(it.productId, 0);
                      }}
                      aria-label={`Remove ${it.name}`}
                    >
                      <Trash2 /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 lg:sticky lg:top-24">
        <PriceSummary totals={totals} freeDeliveryThreshold={rules.freeDeliveryThreshold} />
        <Button
          size="lg"
          variant="brand"
          className="h-12 w-full"
          disabled={outOfStock.length > 0}
          onClick={() => router.push(signedIn ? "/checkout" : "/login?next=/checkout")}
        >
          Place order · {formatINR(totals.total)}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
