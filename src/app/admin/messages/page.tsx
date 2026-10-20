import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { MessagesInbox } from "@/components/admin/messages-inbox";
import { Button } from "@/components/ui/button";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const where = filter === "unread" ? { isRead: false } : filter === "read" ? { isRead: true } : {};
  const [rows, unread] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);
  return (
    <>
      <PageHeader
        title="Contact Messages"
        description={`${unread} unread`}
        actions={
          <div className="flex gap-1">
            {[
              ["all", "All"],
              ["unread", "Unread"],
              ["read", "Read"],
            ].map(([k, l]) => (
              <Button key={k} asChild size="sm" variant={(filter ?? "all") === k ? "default" : "outline"}>
                <Link href={k === "all" ? "/admin/messages" : `/admin/messages?filter=${k}`}>{l}</Link>
              </Button>
            ))}
          </div>
        }
      />
      <MessagesInbox rows={rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </>
  );
}
