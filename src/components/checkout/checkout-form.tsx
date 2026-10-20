"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, CreditCard, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { createOrder, verifyRazorpayPayment } from "@/actions/orders";
import { deleteAddress } from "@/actions/profile";
import { computeTotals, effectivePrice } from "@/lib/pricing";
import { formatINR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PriceSummary } from "@/components/cart/price-summary";
import { AddressFormDialog, type AddressRow } from "./address-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({
  addresses,
  rules,
  codEnabled,
  razorpayEnabled,
  storeName,
  logoUrl,
  profileDefaults,
}: {
  addresses: AddressRow[];
  rules: { deliveryCharge: number; freeDeliveryThreshold: number };
  codEnabled: boolean;
  razorpayEnabled: boolean;
  storeName: string;
  logoUrl: string | null;
  profileDefaults: { fullName: string; phone: string };
}) {
  const router = useRouter();
  const { items, hydrated, clear } = useCartStore();
  const totals = useMemo(() => computeTotals(items, rules), [items, rules]);
  const [addressId, setAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [method, setMethod] = useState<"razorpay" | "cod">(razorpayEnabled ? "razorpay" : "cod");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!addressId && addresses[0]) setAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0].id);
  }, [addresses, addressId]);

  async function placeOrder() {
    if (!addressId) return toast.error("Please add a delivery address");
    setPlacing(true);
    const res = await createOrder({
      addressId,
      paymentMethod: method,
      notes,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    if (!res.ok) {
      setPlacing(false);
      return toast.error(res.error);
    }
    const d = res.data!;

    if (d.paymentMethod === "cod") {
      clear();
      router.replace(`/orders/${d.orderId}?placed=1`);
      return;
    }

    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay || !d.razorpay) {
      setPlacing(false);
      return toast.error("Could not load payment gateway. Please retry or choose COD.");
    }

    const rzp = new window.Razorpay({
      key: d.razorpay.keyId,
      amount: Math.round(d.amount * 100),
      currency: "INR",
      name: storeName,
      description: `Order ${d.orderNumber}`,
      image: logoUrl ?? undefined,
      order_id: d.razorpay.orderId,
      prefill: { name: d.razorpay.name, email: d.razorpay.email, contact: d.razorpay.contact },
      notes: { orderNumber: d.orderNumber },
      theme: { color: "#111111" },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          toast("Payment cancelled. Your order is saved as pending — you can retry from My Orders.");
          router.push(`/orders/${d.orderId}`);
        },
      },
      handler: async (resp: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const v = await verifyRazorpayPayment({
          orderId: d.orderId,
          razorpayOrderId: resp.razorpay_order_id,
          razorpayPaymentId: resp.razorpay_payment_id,
          razorpaySignature: resp.razorpay_signature,
        });
        if (v.ok) {
          clear();
          router.replace(`/orders/${d.orderId}?placed=1`);
        } else {
          setPlacing(false);
          toast.error(v.error);
          router.push(`/orders/${d.orderId}`);
        }
      },
    });
    rzp.on("payment.failed", () => {
      setPlacing(false);
      toast.error("Payment failed. You can retry from My Orders.");
    });
    rzp.open();
  }

  if (!hydrated)
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    );
  if (items.length === 0)
    return (
      <EmptyState
        title="Nothing to check out"
        description="Your cart is empty."
        action={
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        }
      />
    );

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div className="space-y-4 lg:col-span-2">
        {/* Address */}
        <section className="rounded-xl border bg-white p-4" aria-labelledby="addr-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="addr-h" className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4" /> Delivery address
            </h2>
            <AddressFormDialog defaults={profileDefaults} onSaved={(id) => setAddressId(id)} />
          </div>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved addresses yet. Add one to continue.</p>
          ) : (
            <RadioGroup value={addressId} onValueChange={setAddressId} className="grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors",
                    addressId === a.id ? "border-neutral-900 bg-neutral-50" : "hover:bg-neutral-50",
                  )}
                >
                  <RadioGroupItem value={a.id} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      {a.fullName}{" "}
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase">
                        {a.label}
                      </span>
                    </div>
                    <div className="text-neutral-600">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} – {a.pincode}
                    </div>
                    <div className="text-neutral-600">📞 {a.phone}</div>
                    <div className="mt-1 flex gap-1">
                      <AddressFormDialog address={a} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async (e) => {
                          e.preventDefault();
                          const r = await deleteAddress(a.id);
                          if (r.ok) router.refresh();
                          else toast.error(r.error);
                        }}
                      >
                        <Trash2 /> Delete
                      </Button>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-xl border bg-white p-4" aria-labelledby="pay-h">
          <h2 id="pay-h" className="mb-3 flex items-center gap-2 font-semibold">
            <CreditCard className="h-4 w-4" /> Payment method
          </h2>
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as "razorpay" | "cod")}
            className="grid gap-2 sm:grid-cols-2"
          >
            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm",
                method === "razorpay" ? "border-neutral-900 bg-neutral-50" : "hover:bg-neutral-50",
                !razorpayEnabled && "opacity-50",
              )}
            >
              <RadioGroupItem value="razorpay" disabled={!razorpayEnabled} className="mt-0.5" />
              <div>
                <div className="font-semibold">Pay online</div>
                <div className="text-neutral-600">UPI, cards, net banking, wallets — secured by Razorpay</div>
                {!razorpayEnabled && <div className="text-xs text-amber-600">Not configured yet</div>}
              </div>
            </label>
            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm",
                method === "cod" ? "border-neutral-900 bg-neutral-50" : "hover:bg-neutral-50",
                !codEnabled && "opacity-50",
              )}
            >
              <RadioGroupItem value="cod" disabled={!codEnabled} className="mt-0.5" />
              <div>
                <div className="flex items-center gap-1 font-semibold">
                  <Banknote className="h-4 w-4" /> Cash on Delivery
                </div>
                <div className="text-neutral-600">Pay when your order arrives</div>
                {!codEnabled && <div className="text-xs text-amber-600">Currently unavailable</div>}
              </div>
            </label>
          </RadioGroup>
        </section>

        {/* Items */}
        <section className="rounded-xl border bg-white p-4" aria-labelledby="items-h">
          <h2 id="items-h" className="mb-3 font-semibold">
            Order summary ({totals.itemCount} item{totals.itemCount === 1 ? "" : "s"})
          </h2>
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.productId} className="flex items-center gap-3 py-2 text-sm">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-neutral-50">
                  {it.imageUrl && (
                    <Image src={it.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty {it.quantity} × {formatINR(effectivePrice(it))}
                  </div>
                </div>
                <div className="font-semibold tabular-nums">
                  {formatINR(effectivePrice(it) * it.quantity)}
                </div>
              </li>
            ))}
          </ul>
          <Textarea
            className="mt-3"
            rows={2}
            placeholder="Order notes (optional): delivery instructions, landmark…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </section>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24">
        <PriceSummary totals={totals} freeDeliveryThreshold={rules.freeDeliveryThreshold} />
        <Button
          size="lg"
          variant="brand"
          className="h-12 w-full"
          onClick={placeOrder}
          loading={placing}
          disabled={!addressId}
        >
          {method === "cod" ? "Place order" : `Pay ${formatINR(totals.total)}`}
        </Button>
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Safe & secure checkout
        </p>
      </div>
    </div>
  );
}
