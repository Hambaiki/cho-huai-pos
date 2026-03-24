import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils/cn";

const sarabun = Sarabun({
  subsets: ["latin"],
  variable: "--font-sarabun",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "CHO-HUAI POS",
  description: "Simple POS for small stores with BNPL support",
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
