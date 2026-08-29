import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { PWARegister } from "@/components/PWARegister";
import { FloatingControls } from "@/components/FloatingControls";
import { DynamicBg } from "@/components/DynamicBg";

export const metadata: Metadata = {
  title: {
    default: "ORIGIN",
    template: "%s · ORIGIN",
  },
  applicationName: "ORIGIN",
  description:
    "Your private space for building the life you imagined — habits, diary, bucket list, work and asset.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ORIGIN",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon-192.png"],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* iOS Safari hints */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ORIGIN" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-black text-silver-200 font-sans antialiased">
        <DynamicBg />
        <StoreProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <FloatingControls />
          </AuthProvider>
        </StoreProvider>
        <PWARegister />
      </body>
    </html>
  );
}
