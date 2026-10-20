import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { Wordmark } from "@/components/layout/wordmark";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="flex items-center justify-center py-6">
        <Link href="/" aria-label={`${s.storeName} home`}>
          <Wordmark name={s.storeName} logoUrl={s.logoUrl} />
        </Link>
      </header>
      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-12">{children}</div>
    </main>
  );
}
