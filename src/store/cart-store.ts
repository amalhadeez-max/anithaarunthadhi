"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine } from "@/types";
import { clampQuantity } from "@/lib/pricing";

type CartState = {
  items: CartLine[];
  hydrated: boolean;
  addItem: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  replace: (items: CartLine[]) => void;
  setHydrated: (v: boolean) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      addItem: (line, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === line.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === line.productId
                  ? { ...i, ...line, quantity: clampQuantity(i.quantity + qty, line.stock) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...line, quantity: clampQuantity(qty, line.stock) }] };
        }),
      setQuantity: (productId, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clampQuantity(qty, i.stock) } : i,
          ),
        })),
      removeItem: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      replace: (items) => set({ items }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "an-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
