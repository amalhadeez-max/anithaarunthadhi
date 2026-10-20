"use client";
import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { syncCart } from "@/actions/cart";
import { syncWishlist } from "@/actions/wishlist";

/**
 * On sign-in: merge the persisted local cart/wishlist into the DB and replace local state
 * with the canonical result. Runs once per page load after Zustand rehydrates.
 */
export function CartSync({ signedIn }: { signedIn: boolean }) {
  const hydrated = useCartStore((s) => s.hydrated);
  const done = useRef(false);

  useEffect(() => {
    if (!signedIn || !hydrated || done.current) return;
    done.current = true;
    const cart = useCartStore.getState();
    const wish = useWishlistStore.getState();
    syncCart(cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
      .then((lines) => cart.replace(lines))
      .catch(() => {});
    syncWishlist(wish.ids)
      .then((ids) => wish.replace(ids))
      .catch(() => {});
  }, [signedIn, hydrated]);

  return null;
}
