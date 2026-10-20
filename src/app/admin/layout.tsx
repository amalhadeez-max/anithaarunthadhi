import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [settings, unread] = await Promise.all([
    getSiteSettings(),
    prisma.contactMessage.count({ where: { isRead: false } }).catch(() => 0),
  ]);
  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <AdminSidebar storeName={settings.storeName} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-white px-3 lg:h-16 lg:px-6">
          <AdminMobileNav storeName={settings.storeName} unread={unread} />
          <div className="flex-1 truncate text-sm font-semibold lg:hidden">{settings.storeName} · Admin</div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-2 text-sm">
              <span className="hidden text-neutral-600 sm:inline">{admin.fullName ?? admin.email}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={admin.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="text-xs">{initials(admin.fullName, "A")}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
