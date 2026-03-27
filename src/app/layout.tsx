import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Sarabun } from "next/font/google";
import { cn } from "@/lib/utils/cn";
import { AppToaster } from "@/components/ui/AppToaster";
import { PendingActionProvider } from "@/components/ui/PendingActionProvider";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta name="apple-mobile-web-app-title" content="MyWebSite" />
      </head>
      <body
        className={cn(
          `${sarabun.variable} ${ibmPlexSansThai.variable}`,
          `antialiased`,
        )}
      >
        <PendingActionProvider>
          {children}
          <AppToaster />
        </PendingActionProvider>
      </body>
    </html>
  );
}
