import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [s, addresses] = await Promise.all([
    getSiteSettings(),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);
  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-5 text-2xl font-bold">Checkout</h1>
      <CheckoutForm
        addresses={addresses.map((a) => ({ ...a, line2: a.line2 ?? "" }))}
        rules={{ deliveryCharge: s.deliveryCharge, freeDeliveryThreshold: s.freeDeliveryThreshold }}
        codEnabled={s.codEnabled}
        razorpayEnabled={isRazorpayConfigured()}
        storeName={s.storeName}
        logoUrl={s.logoUrl}
        profileDefaults={{ fullName: user.fullName ?? "", phone: user.phone ?? "" }}
      />
    </div>
  );
}
