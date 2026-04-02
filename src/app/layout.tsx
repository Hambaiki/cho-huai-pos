import { AppToaster } from "@/components/interactive/AppToaster";
import { PendingActionProvider } from "@/features/shell/pending/PendingActionProvider";
import { PWAInstallPrompt } from "@/features/shell/pwa/components/PWAInstallPrompt";
import { PWARegister } from "@/features/shell/pwa/components/PWARegister";
import { cn } from "@/lib/utils/cn";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-ibm-plex-sans-thai",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CHO-HUAI POS",
  description: "Simple POS for small stores with BNPL support",
  applicationName: "CHO-HUAI POS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CHO-HUAI POS",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta name="apple-mobile-web-app-title" content="CHO-HUAI POS" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(
          `${sarabun.variable} ${ibmPlexSansThai.variable}`,
          `antialiased`,
        )}
      >
        <PWARegister />
        <PWAInstallPrompt />
        <PendingActionProvider>
          {children}
          <AppToaster />
        </PendingActionProvider>
      </body>
    </html>
  );
}
