"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Store, UserCog } from "lucide-react";
import {
  AppSidebarLayout,
  type AppSidebarNavSection,
  type BreadcrumbItem,
} from "@/components/layout/AppSidebarLayout";
import { createClient } from "@/lib/supabase/client";

const BASE_NAV_SECTIONS: AppSidebarNavSection[] = [
  {
    title: "Workspace",
    items: [
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
  items: [{ href: "/admin", label: "Super Admin", icon: LayoutDashboard }],
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
}

export function DashboardSidebarLayout({
  children,
}: DashboardSidebarLayoutProps) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      setIsSuperAdmin(Boolean(profile?.is_super_admin));
    });
  }, []);

  const navSections = isSuperAdmin
    ? [...BASE_NAV_SECTIONS, SUPER_ADMIN_SECTION]
    : BASE_NAV_SECTIONS;

  return (
    <AppSidebarLayout navSections={navSections} getBreadcrumbs={getBreadcrumbs}>
      {children}
    </AppSidebarLayout>
  );
}
