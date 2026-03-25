import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import { cn } from "@/lib/utils/cn";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
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
      <body className={cn(`${sarabun.variable}`, `antialiased`)}>
        {children}
      </body>
    </html>
  );
}
