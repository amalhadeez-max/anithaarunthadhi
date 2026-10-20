"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type WishlistState = {
  ids: string[];
  toggle: (productId: string) => boolean; // returns new "isWished"
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  replace: (ids: string[]) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const has = get().ids.includes(id);
        set((s) => ({ ids: has ? s.ids.filter((x) => x !== id) : [...s.ids, id] }));
        return !has;
      },
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      has: (id) => get().ids.includes(id),
      replace: (ids) => set({ ids }),
    }),
    { name: "an-wishlist", storage: createJSONStorage(() => localStorage) },
  ),
);
