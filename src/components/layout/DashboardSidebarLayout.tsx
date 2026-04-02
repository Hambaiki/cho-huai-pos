"use client";

import {
  AppSidebarLayout,
  type AppSidebarNavSection,
  type BreadcrumbItem,
} from "@/components/layout/AppSidebarLayout";
import { LayoutDashboard, Shield, Store, UserCog } from "lucide-react";

const BASE_NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/dashboard/stores", label: "Stores", icon: Store, exact: true },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/account", label: "Account Settings", icon: UserCog },
    ],
  },
];

const SUPER_ADMIN_SECTION: AppSidebarNavSection = {
  title: "Administration",
  items: [{ href: "/admin", label: "Super Admin", icon: Shield }],
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];

  if (
    pathname === "/dashboard/stores" ||
    pathname.startsWith("/dashboard/stores/")
  )
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Stores" }];

  if (pathname === "/dashboard/account")
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Account Settings" },
    ];

  return [];
}

interface DashboardSidebarLayoutProps {
  children: React.ReactNode;
  isSuperAdmin: boolean;
}

export function DashboardSidebarLayout({
  children,
  isSuperAdmin,
}: DashboardSidebarLayoutProps) {
  const navSections = isSuperAdmin
    ? [...BASE_NAV_SECTIONS, SUPER_ADMIN_SECTION]
    : BASE_NAV_SECTIONS;

  return (
    <AppSidebarLayout navSections={navSections} getBreadcrumbs={getBreadcrumbs}>
      {children}
    </AppSidebarLayout>
  );
}
