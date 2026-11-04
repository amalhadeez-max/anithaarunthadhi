"use client";
import Link from "next/link";
import { Heart, Mail, Phone, User } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";

/** Navy utility strip above the header: contact details left, account links right. */
export function TopBar({
  phone,
  email,
  userName,
}: {
  phone: string | null;
  email: string | null;
  userName: string | null;
}) {
  const wishCount = useWishlistStore((s) => s.ids.length);
  return (
    <div className="bg-navy text-[11px] text-white sm:text-[13px]">
      <div className="container flex h-[34px] items-center justify-between gap-4 sm:h-[38px]">
        <div className="flex items-center gap-5 sm:gap-7">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-neutral-300">
              <Phone className="h-3.5 w-3.5" /> {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="hidden items-center gap-2 hover:text-neutral-300 sm:flex">
              <Mail className="h-3.5 w-3.5" /> {email}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/orders" className="hidden hover:text-neutral-300 md:block">
            Track Order
          </Link>
          <span className="hidden h-3 w-px bg-[#4A505C] md:block" aria-hidden />
          <Link href="/wishlist" className="hidden items-center gap-1.5 hover:text-neutral-300 md:flex">
            <Heart className="h-3.5 w-3.5" /> Wishlist ({wishCount})
          </Link>
          <span className="hidden h-3 w-px bg-[#4A505C] md:block" aria-hidden />
          {userName ? (
            <Link href="/profile" className="flex items-center gap-1.5 hover:text-neutral-300">
              <User className="h-3.5 w-3.5" /> Hi, {userName.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 hover:text-neutral-300">
              <User className="h-3.5 w-3.5" /> Login / Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
