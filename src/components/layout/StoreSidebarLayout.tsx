"use client";

import {
  BarChart2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import {
  AppSidebarLayout,
  type AppSidebarNavSection,
} from "@/components/layout/AppSidebarLayout";

const NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/reports", label: "Reports", icon: BarChart2 },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/pos", label: "POS", icon: ShoppingCart },
      { href: "/orders", label: "Orders", icon: ClipboardList },
      { href: "/inventory", label: "Inventory", icon: Package },
      { href: "/bnpl", label: "BNPL", icon: CreditCard },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/stores", label: "Stores", icon: Store },
      { href: "/team", label: "Team", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "POS Terminal",
  "/inventory": "Inventory",
  "/inventory/new": "New Product",
  "/orders": "Orders",
  "/bnpl": "BNPL",
  "/reports": "Reports",
  "/stores": "Stores",
  "/team": "Team",
  "/settings": "Settings",
};

function prefixNavSections(basePath: string, sections: AppSidebarNavSection[]): AppSidebarNavSection[] {
  if (!basePath) return sections;

  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href:
        item.href === "/dashboard"
          ? basePath
          : item.href === "/stores"
            ? "/dashboard/stores"
          : `${basePath}${item.href}`,
    })),
  }));
}

function getRelativePath(pathname: string, basePath: string): string {
  if (pathname === basePath) return "/dashboard";
  if (pathname.startsWith(`${basePath}/`)) {
    const suffix = pathname.slice(basePath.length);
    return suffix.startsWith("/") ? suffix : `/${suffix}`;
  }
  return pathname;
}

function getBreadcrumb(pathname: string, basePath: string): string {
  const relativePath = getRelativePath(pathname, basePath);

  if (ROUTE_LABELS[relativePath]) return ROUTE_LABELS[relativePath];
  if (relativePath.startsWith("/inventory/") && relativePath.endsWith("/edit")) return "Edit Product";
  if (relativePath.startsWith("/orders/")) return "Order Details";
  if (relativePath.startsWith("/bnpl/")) return "BNPL Account";
  return "";
}

interface StoreSidebarLayoutProps {
  storeName: string;
  basePath?: string;
  children: React.ReactNode;
}

export function StoreSidebarLayout({
  storeName,
  basePath = "",
  children,
}: StoreSidebarLayoutProps) {
  const normalizedBasePath = basePath.replace(/\/$/, "");

  return (
    <AppSidebarLayout
      subtitle={storeName}
      navSections={prefixNavSections(normalizedBasePath, NAV_SECTIONS)}
      getBreadcrumb={(pathname) => getBreadcrumb(pathname, normalizedBasePath)}
    >
      {children}
    </AppSidebarLayout>
  );
}
