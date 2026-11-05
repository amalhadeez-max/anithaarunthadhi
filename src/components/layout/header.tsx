"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bike,
  Car,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  User,
  X,
} from "lucide-react";
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

/**
 * Desktop nav. `activeOn` marks the link when the current path starts with it;
 * `segment` marks it when `/products?segment=` matches.
 */
const NAV: { href: string; label: string; activeOn?: string; segment?: string }[] = [
  { href: "/", label: "Home" },
  { href: "/products?segment=two_wheeler", label: "2 Wheeler", segment: "two_wheeler" },
  { href: "/products?segment=four_wheeler", label: "4 Wheeler", segment: "four_wheeler" },
  { href: "/products?segment=truck", label: "Truck", segment: "truck" },
  { href: "/products", label: "Brands" },
  { href: "/about", label: "About Us", activeOn: "/about" },
  { href: "/contact", label: "Contact Us", activeOn: "/contact" },
];

const PRODUCT_MENU = [
  { href: "/products", label: "All products", icon: Tags },
  { href: "/products?segment=two_wheeler", label: "2 Wheeler accessories", icon: Bike },
  { href: "/products?segment=four_wheeler", label: "4 Wheeler accessories", icon: Car },
  { href: "/products?segment=truck", label: "Truck accessories", icon: Truck },
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
  const searchParams = useSearchParams();
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

  const isHome = pathname === "/";
  const segment = pathname.startsWith("/products") ? searchParams.get("segment") : null;
  const isProducts = pathname.startsWith("/products") && !segment;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container flex h-[60px] items-center gap-2 md:h-[72px]">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open menu">
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
              {[{ href: "/", label: "Home" }, ...PRODUCT_MENU, { href: "/about", label: "About Us" }, { href: "/contact", label: "Contact Us" }].map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                  {n.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <Link href="/wishlist" className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                Wishlist {wishCount > 0 && `(${wishCount})`}
              </Link>
              <Link href="/cart" className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                Cart
              </Link>
              <Link href="/orders" className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                Track order
              </Link>
              {user ? (
                <>
                  <Link href="/profile" className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                    Profile
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin" className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                      Admin dashboard
                    </Link>
                  )}
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="w-full rounded-md px-3 py-3 text-left text-base font-medium text-destructive hover:bg-neutral-100">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="rounded-md px-3 py-3 text-base font-medium hover:bg-neutral-100">
                  Login / Register
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex-1 lg:flex-none" aria-label={`${storeName} home`}>
          <Wordmark name={storeName} logoUrl={logoUrl} className="text-[21px] md:text-[26px]" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden h-full flex-1 items-center justify-center gap-5 lg:flex xl:gap-8" aria-label="Main">
          <NavLink href="/" active={isHome}>Home</NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-[72px] items-center gap-1 whitespace-nowrap border-b-[3px] border-transparent text-[15px] font-medium text-neutral-800 transition-colors hover:text-brand",
                  isProducts && "border-brand text-brand",
                )}
              >
                Products <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              {PRODUCT_MENU.map((m) => (
                <DropdownMenuItem key={m.href} asChild>
                  <Link href={m.href}>
                    <m.icon /> {m.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV.slice(1).map((n) => (
            <NavLink
              key={n.href}
              href={n.href}
              active={
                (n.activeOn !== undefined && pathname.startsWith(n.activeOn)) ||
                (n.segment !== undefined && n.segment === segment)
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
            {searchOpen ? <X className="h-5 w-5 md:h-6 md:w-6" /> : <Search className="h-5 w-5 md:h-6 md:w-6" />}
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={`Cart, ${cartCount} items`} className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {hydrated && <Dot>{cartCount > 99 ? "99+" : cartCount}</Dot>}
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full ring-offset-2 focus-visible:ring-2" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">{initials(user.fullName, user.email[0]?.toUpperCase())}</AvatarFallback>
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
                  <Link href="/profile"><User /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders"><Package /> My orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist"><Heart /> Wishlist</Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><ShieldCheck /> Admin dashboard</Link>
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
                <User className="h-5 w-5 md:h-6 md:w-6" />
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
            <Button type="submit" size="sm" className="h-10 bg-brand hover:bg-brand-dark">
              Search
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-[72px] items-center whitespace-nowrap border-b-[3px] border-transparent text-[15px] font-medium text-neutral-800 transition-colors hover:text-brand",
        active && "border-brand text-brand",
      )}
    >
      {children}
    </Link>
  );
}

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
      {children}
    </span>
  );
}
