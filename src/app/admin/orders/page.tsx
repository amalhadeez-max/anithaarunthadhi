import { Suspense } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { formatINR, formatDateTime, toNumber } from "@/lib/utils";
import { orderStatusEnum } from "@/lib/validations";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { Pagination } from "@/components/admin/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";

type SP = {
  q?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  payment?: string;
  customer?: string;
  page?: string;
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const status = orderStatusEnum.safeParse(sp.status);
  const where: Prisma.OrderWhereInput = {
    ...(status.success ? { status: status.data } : {}),
    ...(sp.method === "razorpay" || sp.method === "cod" ? { paymentMethod: sp.method } : {}),
    ...(sp.payment === "paid" ? { paymentStatus: "paid" } : {}),
    ...(sp.customer ? { userId: sp.customer } : {}),
    ...(sp.from || sp.to
      ? {
          createdAt: {
            ...(sp.from ? { gte: startOfDay(new Date(sp.from)) } : {}),
            ...(sp.to ? { lte: endOfDay(new Date(sp.to)) } : {}),
          },
        }
      : {}),
    ...(sp.q
      ? {
          OR: [
            { orderNumber: { contains: sp.q, mode: "insensitive" } },
            { user: { fullName: { contains: sp.q, mode: "insensitive" } } },
            { user: { email: { contains: sp.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { user: { select: { fullName: true, email: true } }, _count: { select: { items: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const makeHref = (p: number) => {
    const n = new URLSearchParams(sp as Record<string, string>);
    n.set("page", String(p));
    return `/admin/orders?${n.toString()}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}`} />
      <Suspense>
        <OrdersFilters />
      </Suspense>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {o._count.items} item{o._count.items === 1 ? "" : "s"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{o.user.fullName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{o.user.email}</div>
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
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No orders match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </>
  );
}
