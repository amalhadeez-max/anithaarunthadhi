import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { formatINR, formatDate, toNumber } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where = sp.q
    ? {
        OR: [
          { fullName: { contains: sp.q, mode: "insensitive" as const } },
          { email: { contains: sp.q, mode: "insensitive" as const } },
          { phone: { contains: sp.q } },
        ],
      }
    : {};
  const [total, customers] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { _count: { select: { orders: true } } },
    }),
  ]);
  const spend = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: customers.map((c) => c.id) }, paymentStatus: "paid" },
    _sum: { total: true },
  });
  const spendBy = new Map(spend.map((s) => [s.userId, toNumber(s._sum.total ?? 0)]));
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <>
      <PageHeader title="Customers" description={`${total} account${total === 1 ? "" : "s"}`} />
      <form className="mb-4">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search name, email or phone…"
          className="h-9 w-full max-w-md rounded-md border bg-white px-3 text-sm"
        />
      </form>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/admin/customers/${c.id}`} className="font-medium hover:underline">
                    {c.fullName ?? "—"}
                  </Link>{" "}
                  {c.role === "admin" && (
                    <Badge variant="brand" className="ml-1">
                      admin
                    </Badge>
                  )}
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </TableCell>
                <TableCell className="hidden text-sm sm:table-cell">{c.phone ?? "—"}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDate(c.createdAt)}
                </TableCell>
                <TableCell className="text-center">{c._count.orders}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatINR(spendBy.get(c.id) ?? 0)}
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        makeHref={(p) =>
          `/admin/customers?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`
        }
      />
    </>
  );
}
