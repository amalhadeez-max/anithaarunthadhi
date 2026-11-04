import { getSiteSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { CartSync } from "@/components/cart/cart-sync";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSiteSettings(), getCurrentUser()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar phone={settings.contactPhone} email={settings.contactEmail} userName={user?.fullName ?? null} />
      <Header
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        user={
          user
            ? {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
              }
            : null
        }
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <WhatsAppButton number={settings.whatsappNumber} />
      <CartSync signedIn={Boolean(user)} />
    </div>
  );
}
