"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import type { CartLine } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { setCartLine } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { cn } from "@/lib/utils";

export function BuyBox({ product }: { product: Omit<CartLine, "quantity"> }) {
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.find((i) => i.productId === product.productId)?.quantity ?? 0);
  const wished = useWishlistStore((s) => s.ids.includes(product.productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const out = product.stock <= 0;

  function add(goToCheckout = false) {
    addItem(product, qty);
    void setCartLine(product.productId, inCart + qty);
    if (goToCheckout) router.push("/checkout");
    else
      toast.success(`Added ${qty} × ${product.name}`, {
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Quantity</span>
        <QuantityStepper value={qty} onChange={setQty} max={product.stock} disabled={out} />
        {product.stock > 0 && product.stock <= 5 && (
          <span className="text-xs font-medium text-amber-600">Only {product.stock} left</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" variant="outline" onClick={() => add(false)} disabled={out} className="h-12">
          <ShoppingCart /> Add to cart
        </Button>
        <Button size="lg" variant="brand" onClick={() => add(true)} disabled={out} className="h-12">
          <Zap /> Buy now
        </Button>
      </div>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          const now = toggle(product.productId);
          void toggleWishlist(product.productId, now);
          toast(now ? "Saved to wishlist" : "Removed from wishlist");
        }}
        aria-pressed={wished}
      >
        <Heart className={cn(wished && "fill-brand text-brand")} />{" "}
        {wished ? "In your wishlist" : "Add to wishlist"}
      </Button>
    </div>
  );
}
