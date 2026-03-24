"use client";

import { ArrowLeft, LayoutDashboard, Store, Users } from "lucide-react";
import {
  AppSidebarLayout,
  type AppSidebarFooterLink,
  type AppSidebarNavSection,
} from "@/components/layout/AppSidebarLayout";

const NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/stores", label: "Stores", icon: Store },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
];

const FOOTER_LINKS: AppSidebarFooterLink[] = [
  { href: "/dashboard", label: "Back to Store", icon: ArrowLeft },
];

const ROUTE_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/stores": "Stores",
  "/admin/users": "Users",
};

function getBreadcrumb(pathname: string): string {
  return ROUTE_LABELS[pathname] ?? "";
}

interface AdminSidebarLayoutProps {
  children: React.ReactNode;
}

export function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  return (
    <AppSidebarLayout
      subtitle="Super Admin"
      navSections={NAV_SECTIONS}
      getBreadcrumb={getBreadcrumb}
      footerLinks={FOOTER_LINKS}
    >
      {children}
    </AppSidebarLayout>
  );
}
