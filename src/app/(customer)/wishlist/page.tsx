import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-5 text-2xl font-bold">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
