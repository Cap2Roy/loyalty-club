import type { Metadata, Viewport } from "next";
import { currentUser } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import ChatWidget from "@/components/ChatWidget";
import PWARegister from "@/components/PWARegister";
import MorphingOrbs from "@/components/MorphingOrbs";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoyaltyClub",
  description: "Generic multi-business loyalty platform",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <MorphingOrbs />
        <PWARegister />
        <TopBar userName={user?.email ?? null} />
        <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
          <PageTransition>{children}</PageTransition>
        </main>
        <ChatWidget />
      </body>
    </html>
  );
}
