"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, Menu, Package, Search, ShieldCheck, ShoppingCart, User, X } from "lucide-react";
import { Wordmark } from "./wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore, selectCartCount } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn, initials } from "@/lib/utils";

export type HeaderUser = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  role: "customer" | "admin";
} | null;

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact Us" },
];

export function Header({
  storeName,
  logoUrl,
  user,
}: {
  storeName: string;
  logoUrl: string | null;
  user: HeaderUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const cartCount = useCartStore(selectCartCount);
  const hydrated = useCartStore((s) => s.hydrated);
  const wishCount = useWishlistStore((s) => s.ids.length);

  useEffect(() => setOpen(false), [pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    setSearchOpen(false);
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-14 items-center gap-2 md:h-16">
        {/* Left: hamburger (mobile) / nav (desktop) */}
        <div className="flex flex-1 items-center gap-1 md:flex-none">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle>
                  <Wordmark name={storeName} logoUrl={logoUrl} size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2" aria-label="Main">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100",
                      pathname === n.href && "bg-neutral-100",
                    )}
                  >
                    {n.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                <Link
                  href="/wishlist"
                  className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100"
                >
                  Wishlist
                </Link>
                <Link
                  href="/cart"
                  className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100"
                >
                  Cart
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100"
                    >
                      Profile
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100"
                      >
                        Admin dashboard
                      </Link>
                    )}
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="w-full rounded-md px-3 py-3 text-left text-base font-medium text-destructive hover:bg-neutral-100"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100"
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="hidden md:block" aria-label={`${storeName} home`}>
            <Wordmark name={storeName} logoUrl={logoUrl} />
          </Link>
        </div>

        {/* Centre: wordmark on mobile / nav on desktop */}
        <div className="flex flex-1 justify-center">
          <Link href="/" className="md:hidden" aria-label={`${storeName} home`}>
            <Wordmark name={storeName} logoUrl={logoUrl} size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
                  (pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href))) &&
                    "text-neutral-900",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: icons */}
        <div className="flex flex-1 items-center justify-end gap-0.5 md:flex-none">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={`Wishlist, ${wishCount} items`}
            className="relative"
          >
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
              {wishCount > 0 && <Dot>{wishCount}</Dot>}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={`Cart, ${cartCount} items`}
            className="relative"
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {hydrated && cartCount > 0 && <Dot>{cartCount > 99 ? "99+" : cartCount}</Dot>}
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 rounded-full ring-offset-2 focus-visible:ring-2"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {initials(user.fullName, user.email[0]?.toUpperCase())}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  <div className="text-sm font-medium">{user.fullName ?? "My account"}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <Package /> My orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist">
                    <Heart /> Wishlist
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck /> Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post" className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="icon" aria-label="Sign in">
              <Link href="/login">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t bg-white">
          <form onSubmit={submitSearch} className="container flex items-center gap-2 py-2">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search helmets, seat covers, tarpaulins…"
              aria-label="Search products"
              className="h-10"
            />
            <Button type="submit" size="sm" className="h-10">
              Search
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
      {children}
    </span>
  );
}
