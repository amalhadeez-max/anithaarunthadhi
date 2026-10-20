import Link from "next/link";
import { startOfDay } from "date-fns";
import { IndianRupee, Package, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime, toNumber } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD, ORDER_STATUS_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const today = startOfDay(new Date());
  const [todayOrders, todayRevenue, pendingOrders, lowStock, recent] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today }, status: { not: "pending_payment" } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today }, paymentStatus: "paid" },
    }),
    prisma.order.count({ where: { status: { in: ["placed", "confirmed", "packed"] } } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { fullName: true, email: true } }, _count: { select: { items: true } } },
    }),
  ]);

  const kpis = [
    { label: "Today's orders", value: String(todayOrders), icon: ShoppingBag, href: "/admin/orders" },
    {
      label: "Today's revenue",
      value: formatINR(toNumber(todayRevenue._sum.total ?? 0)),
      icon: IndianRupee,
      href: "/admin/orders?payment=paid",
    },
    {
      label: "Pending orders",
      value: String(pendingOrders),
      icon: Package,
      href: "/admin/orders?status=placed",
    },
    {
      label: "Low-stock products",
      value: String(lowStock),
      icon: AlertTriangle,
      href: "/admin/products?status=low",
      warn: lowStock > 0,
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="What's happening in the store today." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`rounded-lg p-3 ${k.warn ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-700"}`}
                >
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
                  <div className="text-2xl font-bold tabular-nums">{k.value}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Recent orders</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden sm:table-cell">Customer</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {o._count.items} item{o._count.items === 1 ? "" : "s"}
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm sm:table-cell">
                  {o.user.fullName ?? o.user.email}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDateTime(o.createdAt)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatINR(toNumber(o.total))}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <PaymentStatusBadge status={o.paymentStatus} method={o.paymentMethod} />
                </TableCell>
              </TableRow>
            ))}
            {recent.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Statuses: {Object.values(ORDER_STATUS_LABEL).join(" → ")}
      </p>
    </>
  );
}
