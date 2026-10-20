import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [s, user] = await Promise.all([getSiteSettings(), getCurrentUser()]);
  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-5 text-2xl font-bold">Shopping cart</h1>
      <CartView
        rules={{ deliveryCharge: s.deliveryCharge, freeDeliveryThreshold: s.freeDeliveryThreshold }}
        signedIn={Boolean(user)}
      />
    </div>
  );
}
