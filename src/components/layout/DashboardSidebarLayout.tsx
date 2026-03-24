"use client";

import { Store, UserCog } from "lucide-react";
import {
  AppSidebarLayout,
  type AppSidebarNavSection,
} from "@/components/layout/AppSidebarLayout";

const NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    title: "Workspace",
    items: [{ href: "/dashboard/stores", label: "Stores", icon: Store, exact: true }],
  },
  {
    title: "Account",
    items: [{ href: "/dashboard/account", label: "Account Settings", icon: UserCog }],
  },
];

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard/stores": "Stores",
  "/dashboard/account": "Account Settings",
};

function getBreadcrumb(pathname: string): string {
  return ROUTE_LABELS[pathname] ?? "";
}

interface DashboardSidebarLayoutProps {
  children: React.ReactNode;
}

export function DashboardSidebarLayout({ children }: DashboardSidebarLayoutProps) {
  return (
    <AppSidebarLayout
      subtitle="Your workspace"
      navSections={NAV_SECTIONS}
      getBreadcrumb={getBreadcrumb}
    >
      {children}
    </AppSidebarLayout>
  );
}