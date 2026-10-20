import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { NavProgress } from "@/components/layout/nav-progress";
import { getSiteSettings } from "@/lib/settings";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(publicEnv.appUrl),
    title: { default: `${s.storeName} — Vehicle Accessories`, template: `%s | ${s.storeName}` },
    description: s.tagline,
    applicationName: s.storeName,
    openGraph: {
      siteName: s.storeName,
      type: "website",
      locale: "en_IN",
      title: s.storeName,
      description: s.tagline,
    },
    twitter: { card: "summary_large_image", title: s.storeName, description: s.tagline },
    icons: { icon: "/favicon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <Providers>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
