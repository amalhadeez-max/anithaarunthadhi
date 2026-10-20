import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Mail, Phone, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime, toNumber } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusEditor } from "@/components/admin/order-status-editor";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Button } from "@/components/ui/button";

type Addr = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: true, payment: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const a = order.shippingAddress as Addr;

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
            <Button asChild variant="outline" size="sm">
              <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener">
                <Download /> Invoice
              </a>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border bg-white p-4">
            <OrderTimeline status={order.status} history={order.history} />
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">Items</h2>
            <ul className="divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-neutral-50">
                    {it.imageUrl && (
                      <Image
                        src={it.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${it.productId}`} className="font-medium hover:underline">
                      {it.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      SKU {it.sku} · {it.quantity} × {formatINR(toNumber(it.unitPrice))}
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums">{formatINR(toNumber(it.lineTotal))}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(toNumber(order.subtotal))}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd>− {formatINR(toNumber(order.discount))}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{formatINR(toNumber(order.deliveryCharge))}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{formatINR(toNumber(order.total))}</dd>
              </div>
            </dl>
            {order.notes && (
              <p className="mt-3 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                <strong>Customer note:</strong> {order.notes}
              </p>
            )}
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">Status history</h2>
            <ol className="space-y-2 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex flex-wrap gap-x-2">
                  <span className="tabular-nums text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                  <span className="font-medium">
                    {h.fromStatus && h.fromStatus !== h.toStatus
                      ? `${ORDER_STATUS_LABEL[h.fromStatus]} → `
                      : ""}
                    {ORDER_STATUS_LABEL[h.toStatus]}
                  </span>
                  {h.changedByName && <span className="text-muted-foreground">by {h.changedByName}</span>}
                  {h.note && <span className="w-full text-muted-foreground">“{h.note}”</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-4 text-sm">
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <User className="h-4 w-4" /> Customer
            </h2>
            <Link href={`/admin/customers/${order.userId}`} className="font-medium hover:underline">
              {order.user.fullName ?? "—"}
            </Link>
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {order.user.email}
            </div>
            {order.user.phone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {order.user.phone}
              </div>
            )}
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ship to
            </h3>
            <address className="not-italic text-neutral-700">
              <div className="font-medium">{a.fullName}</div>
              <div>
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </div>
              <div>
                {a.city}, {a.state} – {a.pincode}
              </div>
              <div>📞 {a.phone}</div>
            </address>
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment
            </h3>
            <div>
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"} ·{" "}
              <span className="capitalize">{order.paymentStatus.replace("_", " ")}</span>
            </div>
            {order.payment?.razorpayOrderId && (
              <div className="font-mono text-xs text-muted-foreground">
                order: {order.payment.razorpayOrderId}
              </div>
            )}
            {order.payment?.razorpayPaymentId && (
              <div className="font-mono text-xs text-muted-foreground">
                payment: {order.payment.razorpayPaymentId}
              </div>
            )}
            {order.payment?.refundId && (
              <div className="font-mono text-xs text-muted-foreground">refund: {order.payment.refundId}</div>
            )}
          </section>
          <OrderStatusEditor
            orderId={order.id}
            status={order.status}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
            courier={order.courier}
            trackingNumber={order.trackingNumber}
          />
        </div>
      </div>
    </>
  );
}
