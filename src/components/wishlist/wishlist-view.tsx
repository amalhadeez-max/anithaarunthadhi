"use client";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductCard } from "@/types";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { toggleWishlist } from "@/actions/wishlist";
import { setCartLine } from "@/actions/cart";
import { effectivePrice } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";

export function WishlistView() {
  const ids = useWishlistStore((s) => s.ids);
  const remove = useWishlistStore((s) => s.remove);
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery<{ items: ProductCard[] }>({
    queryKey: ["wishlist-products", ids.join(",")],
    queryFn: async () => (await fetch(`/api/products?ids=${ids.join(",")}`)).json(),
    enabled: ids.length > 0,
  });

  if (ids.length === 0) {
    return (
      <EmptyState
        icon={<Heart />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it for later."
        action={
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        }
      />
    );
  }
  if (isLoading || !data)
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    );

  const order = new Map(ids.map((id, i) => [id, i]));
  const items = [...data.items].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border bg-white">
          <Link href={`/products/${p.slug}`} className="relative aspect-square bg-neutral-50">
            {p.imageUrl && (
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                sizes="(max-width:768px) 50vw, 25vw"
                className="object-cover"
              />
            )}
          </Link>
          <div className="flex flex-1 flex-col gap-1 p-3">
            <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-semibold hover:underline">
              {p.name}
            </Link>
            <StarRating value={p.ratingAvg} count={p.ratingCount} size="xs" />
            <div className="font-bold">{formatINR(effectivePrice(p))}</div>
            <div className="mt-auto flex gap-1 pt-2">
              <Button
                size="sm"
                className="h-8 flex-1"
                disabled={p.stock <= 0}
                onClick={() => {
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
                    1,
                  );
                  void setCartLine(p.id, 1);
                  remove(p.id);
                  void toggleWishlist(p.id, false);
                  toast.success("Moved to cart");
                }}
              >
                <ShoppingCart /> {p.stock <= 0 ? "Out of stock" : "Move to cart"}
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                className="h-8"
                aria-label="Remove from wishlist"
                onClick={() => {
                  remove(p.id);
                  void toggleWishlist(p.id, false);
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
