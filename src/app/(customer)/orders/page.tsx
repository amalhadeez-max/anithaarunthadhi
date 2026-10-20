import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate, toNumber } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
    take: 50,
  });

  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-5 text-2xl font-bold">My orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No orders yet"
          description="When you place an order it will show up here with live status."
          action={
            <Button asChild>
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-xl border bg-white">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b bg-neutral-50 px-4 py-3 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Order</div>
                  <div className="font-semibold">{o.orderNumber}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Placed</div>
                  <div>{formatDate(o.createdAt)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="font-semibold tabular-nums">{formatINR(toNumber(o.total))}</div>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <PaymentStatusBadge status={o.paymentStatus} method={o.paymentMethod} />
                </div>
                <Link
                  href={`/orders/${o.id}`}
                  className="ml-auto inline-flex items-center gap-1 font-medium hover:underline"
                >
                  View details <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <ul className="space-y-2">
                  {o.items.slice(0, 3).map((it) => (
                    <li key={it.id} className="flex items-center gap-3 text-sm">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-neutral-50">
                        {it.imageUrl && (
                          <Image src={it.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">Qty {it.quantity}</div>
                      </div>
                    </li>
                  ))}
                  {o.items.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      + {o.items.length - 3} more item{o.items.length - 3 === 1 ? "" : "s"}
                    </li>
                  )}
                </ul>
                <div className="hidden md:block">
                  <OrderTimeline status={o.status} history={o.history} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
