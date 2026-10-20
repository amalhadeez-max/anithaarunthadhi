import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime, formatDate, toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Badge } from "@/components/ui/badge";

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.profile.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } },
      addresses: true,
    },
  });
  if (!c) notFound();
  const spend = c.orders.filter((o) => o.paymentStatus === "paid").reduce((n, o) => n + toNumber(o.total), 0);
  return (
    <>
      <PageHeader
        title={c.fullName ?? c.email}
        description={`Joined ${formatDate(c.createdAt)} · ${c.orders.length} orders · ${formatINR(spend)} spent`}
        actions={
          <Badge variant={c.role === "admin" ? "brand" : "secondary"} className="capitalize">
            {c.role}
          </Badge>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">Contact</h2>
          <div>{c.email}</div>
          <div>{c.phone ?? "—"}</div>
          {(c.addressLine1 || c.city) && (
            <div className="mt-2 text-neutral-700">
              {[c.addressLine1, c.addressLine2, c.city, c.state, c.pincode].filter(Boolean).join(", ")}
            </div>
          )}
          <h2 className="mb-2 mt-4 font-semibold">Saved addresses</h2>
          {c.addresses.length === 0 ? (
            <p className="text-muted-foreground">None</p>
          ) : (
            <ul className="space-y-2">
              {c.addresses.map((a) => (
                <li key={a.id} className="rounded-md bg-neutral-50 p-2">
                  <div className="font-medium">
                    {a.fullName}{" "}
                    <span className="text-xs uppercase text-muted-foreground">
                      {a.label}
                      {a.isDefault ? " · default" : ""}
                    </span>
                  </div>
                  <div className="text-neutral-700">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} – {a.pincode}
                  </div>
                  <div>📞 {a.phone}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border bg-white lg:col-span-2">
          <h2 className="border-b px-4 py-3 font-semibold">Orders</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                    <div className="text-xs text-muted-foreground">{o._count.items} items</div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(toNumber(o.total))}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <PaymentStatusBadge status={o.paymentStatus} method={o.paymentMethod} />
                  </TableCell>
                </TableRow>
              ))}
              {c.orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      </div>
    </>
  );
}
