import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime, toNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderActions } from "@/components/orders/order-actions";

export const metadata: Metadata = { title: "Order details" };

type Addr = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, requireUser()]);
  const order = await prisma.order.findFirst({
    where: { id, ...(user.role === "admin" ? {} : { userId: user.id }) },
    include: { items: true, history: { orderBy: { createdAt: "asc" } }, payment: true },
  });
  if (!order) notFound();
  const addr = order.shippingAddress as Addr;

  return (
    <div className="container max-w-5xl py-6 md:py-10">
      {sp.placed === "1" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <h2 className="font-bold">Order placed successfully!</h2>
            <p className="text-sm">
              Your order ID is <strong>{order.orderNumber}</strong>. We&apos;ve emailed you a confirmation
              {order.paymentMethod === "cod" ? " — please keep cash ready at delivery." : "."}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/orders" className="hover:underline">
              My orders
            </Link>{" "}
            / {order.orderNumber}
          </p>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
      </div>

      <div className="mb-4 rounded-xl border bg-white p-4 md:p-6">
        <OrderTimeline status={order.status} history={order.history} />
        {order.trackingNumber && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-50 p-3 text-sm">
            <Truck className="h-4 w-4" /> Shipped via <strong>{order.courier}</strong> · Tracking #{" "}
            <strong>{order.trackingNumber}</strong>
          </p>
        )}
      </div>

      <div className="mb-4">
        <OrderActions
          orderId={order.id}
          status={order.status}
          canRetryPayment={order.status === "pending_payment" && order.paymentStatus !== "paid"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border bg-white p-4 md:col-span-2" aria-labelledby="items-h">
          <h2 id="items-h" className="mb-3 font-semibold">
            Items
          </h2>
          <ul className="divide-y">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-neutral-50">
                  {it.imageUrl && (
                    <Image src={it.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">
                    SKU {it.sku} · Qty {it.quantity} × {formatINR(toNumber(it.unitPrice))}
                  </div>
                </div>
                <div className="font-semibold tabular-nums">{formatINR(toNumber(it.lineTotal))}</div>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatINR(toNumber(order.subtotal))}</dd>
            </div>
            {toNumber(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd className="tabular-nums">− {formatINR(toNumber(order.discount))}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className="tabular-nums">
                {toNumber(order.deliveryCharge) === 0 ? "FREE" : formatINR(toNumber(order.deliveryCharge))}
              </dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatINR(toNumber(order.total))}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-4" aria-labelledby="addr-h">
            <h2 id="addr-h" className="mb-2 flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4" /> Delivery address
            </h2>
            <address className="text-sm not-italic text-neutral-700">
              <div className="font-medium">{addr.fullName}</div>
              <div>
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
              </div>
              <div>
                {addr.city}, {addr.state} – {addr.pincode}
              </div>
              <div>📞 {addr.phone}</div>
            </address>
          </section>
          <section className="rounded-xl border bg-white p-4" aria-labelledby="pay-h">
            <h2 id="pay-h" className="mb-2 font-semibold">
              Payment
            </h2>
            <dl className="space-y-1 text-sm text-neutral-700">
              <div className="flex justify-between">
                <dt>Method</dt>
                <dd>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className="capitalize">{order.paymentStatus.replace("_", " ")}</dd>
              </div>
              {order.payment?.razorpayPaymentId && (
                <div className="flex justify-between gap-2">
                  <dt>Payment ID</dt>
                  <dd className="truncate font-mono text-xs">{order.payment.razorpayPaymentId}</dd>
                </div>
              )}
            </dl>
          </section>
          <section className="rounded-xl border bg-white p-4" aria-labelledby="hist-h">
            <h2 id="hist-h" className="mb-2 font-semibold">
              History
            </h2>
            <ol className="space-y-2 text-sm">
              {order.history.map((h) => (
                <li key={h.id}>
                  <div className="font-medium">{ORDER_STATUS_LABEL[h.toStatus]}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(h.createdAt)}
                    {h.note ? ` · ${h.note}` : ""}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
