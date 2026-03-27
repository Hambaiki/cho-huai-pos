"use client";

import {
  ArrowLeft,
  BarChart2,
  ClipboardList,
  DollarSign,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  AppSidebarFooterLink,
  AppSidebarLayout,
  type AppSidebarNavSection,
  type BreadcrumbItem,
} from "@/components/layout/AppSidebarLayout";

const NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        label: "Store Overview",
        icon: Home,
        exact: true,
      },
      { href: "/reports", label: "Reports", icon: BarChart2 },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/pos", label: "POS", icon: ShoppingCart },
      { href: "/orders", label: "Orders", icon: ClipboardList },
      { href: "/inventory", label: "Inventory", icon: Package },
      { href: "/bnpl", label: "BNPL", icon: DollarSign },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const FOOTER_LINKS: AppSidebarFooterLink[] = [
  { href: "/dashboard", label: "Back to Dashboard", icon: ArrowLeft },
];

function prefixNavSections(
  basePath: string,
  sections: AppSidebarNavSection[],
): AppSidebarNavSection[] {
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

function getBreadcrumbs(
  pathname: string,
  basePath: string,
  storeName: string,
): BreadcrumbItem[] {
  const rel = getRelativePath(pathname, basePath);
  const dashboardRoot: BreadcrumbItem = {
    label: "Dashboard",
    href: "/dashboard",
  };
  const storeRoot: BreadcrumbItem = { label: storeName, href: basePath };

  if (rel === "/dashboard") return [dashboardRoot, { label: storeName }];
  if (rel === "/pos") return [dashboardRoot, storeRoot, { label: "POS" }];
  if (rel === "/reports")
    return [dashboardRoot, storeRoot, { label: "Reports" }];
  if (rel === "/stores") return [dashboardRoot, storeRoot, { label: "Stores" }];
  if (rel === "/team") return [dashboardRoot, storeRoot, { label: "Team" }];
  if (rel === "/settings")
    return [dashboardRoot, storeRoot, { label: "Settings" }];

  if (rel === "/inventory")
    return [dashboardRoot, storeRoot, { label: "Inventory" }];
  if (rel === "/inventory/new")
    return [
      dashboardRoot,
      storeRoot,
      { label: "Inventory", href: `${basePath}/inventory` },
      { label: "New Product" },
    ];
  if (rel.startsWith("/inventory/") && rel.endsWith("/edit"))
    return [
      dashboardRoot,
      storeRoot,
      { label: "Inventory", href: `${basePath}/inventory` },
      { label: "Edit Product" },
    ];

  if (rel === "/orders") return [dashboardRoot, storeRoot, { label: "Orders" }];
  if (rel.startsWith("/orders/"))
    return [
      dashboardRoot,
      storeRoot,
      { label: "Orders", href: `${basePath}/orders` },
      { label: "Order Details" },
    ];

  if (rel === "/bnpl") return [dashboardRoot, storeRoot, { label: "BNPL" }];
  if (rel.startsWith("/bnpl/"))
    return [
      dashboardRoot,
      storeRoot,
      { label: "BNPL", href: `${basePath}/bnpl` },
      { label: "Account" },
    ];

  return [];
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
      navSections={prefixNavSections(normalizedBasePath, NAV_SECTIONS)}
      getBreadcrumbs={(pathname) =>
        getBreadcrumbs(pathname, normalizedBasePath, storeName)
      }
      footerLinks={FOOTER_LINKS}
    >
      {children}
    </AppSidebarLayout>
  );
}
