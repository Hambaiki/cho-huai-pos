"use client";

import { ArrowLeft, LayoutDashboard, Store, Users } from "lucide-react";
import {
  AppSidebarLayout,
  type AppSidebarFooterLink,
  type AppSidebarNavSection,
  type BreadcrumbItem,
} from "@/components/layout/AppSidebarLayout";

const NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/admin/stores", label: "Stores", icon: Store },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
];

const FOOTER_LINKS: AppSidebarFooterLink[] = [
  { href: "/dashboard", label: "Back to dashboard", icon: ArrowLeft },
];

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/admin")
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }];
  if (pathname === "/admin/stores")
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Stores" },
    ];
  if (pathname === "/admin/users")
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Users" },
    ];
  return [];
}

interface AdminSidebarLayoutProps {
  children: React.ReactNode;
}

export function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  return (
    <AppSidebarLayout
      navSections={NAV_SECTIONS}
      getBreadcrumbs={getBreadcrumbs}
      footerLinks={FOOTER_LINKS}
    >
      {children}
    </AppSidebarLayout>
  );
}
