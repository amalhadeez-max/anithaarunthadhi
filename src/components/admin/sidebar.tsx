"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Users,
  Menu,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/brands", label: "Brands / Models", icon: Tags },
  { href: "/admin/variants", label: "Vehicle Variants", icon: Car },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Contact Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

function NavLinks({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Admin">
      {ADMIN_NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white",
              active && "bg-neutral-800 text-white",
            )}
          >
            <n.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{n.label}</span>
            {n.href === "/admin/messages" && unread > 0 && (
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
      <div className="my-2 h-px bg-neutral-800" />
      <Link
        href="/"
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white"
      >
        <ExternalLink className="h-4 w-4" /> View storefront
      </Link>
    </nav>
  );
}

export function AdminSidebar({ storeName, unread }: { storeName: string; unread: number }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 text-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-800 px-5">
        <Layers className="h-5 w-5 text-brand" />
        <div className="leading-tight">
          <div className="text-sm font-bold">{storeName}</div>
          <div className="text-[11px] uppercase tracking-wider text-neutral-400">Admin</div>
        </div>
      </div>
      <NavLinks unread={unread} />
    </aside>
  );
}

export function AdminMobileNav({ storeName, unread }: { storeName: string; unread: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-neutral-950 p-0 text-white [&>button]:text-white">
        <SheetHeader className="border-b border-neutral-800 p-4 text-left">
          <SheetTitle className="text-white">{storeName} · Admin</SheetTitle>
        </SheetHeader>
        <NavLinks unread={unread} />
      </SheetContent>
    </Sheet>
  );
}
