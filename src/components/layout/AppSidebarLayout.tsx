"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";

export interface AppSidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface AppSidebarNavSection {
  title?: string;
  items: AppSidebarNavItem[];
}

export interface AppSidebarFooterLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AppSidebarLayoutProps {
  subtitle: string;
  navSections: AppSidebarNavSection[];
  getBreadcrumb: (pathname: string) => string;
  footerLinks?: AppSidebarFooterLink[];
  children: React.ReactNode;
}

function isActiveNavItem(pathname: string, item: AppSidebarNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebarLayout({
  subtitle,
  navSections,
  getBreadcrumb,
  footerLinks = [],
  children,
}: AppSidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-brand-700">
            Cho-Huai POS
          </p>
          <p className="mt-0.5 max-w-40 truncate text-sm font-medium text-neutral-600">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {navSections.map((section, index) => (
          <div key={section.title ?? `section-${index}`}>
            {section.title ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                {section.title}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActiveNavItem(pathname, { href, label, icon: Icon, exact });

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                    )}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-neutral-200 px-2 py-3">
        <div className="space-y-0.5">
          {footerLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          <form action={signOutAction}>
            <button
              type="submit"
              onClick={() => setSidebarOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      <aside className="hidden border-r border-neutral-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-56 lg:flex-col">
        {sidebarContent}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 flex lg:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-neutral-900/40 transition-opacity duration-200",
            sidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            "relative z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-250 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </aside>
      </div>

      <div className="flex h-screen min-w-0 flex-1 flex-col pt-14 lg:pl-56">
        <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-6 lg:left-56 lg:right-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {breadcrumb ? <h1 className="text-sm font-semibold text-neutral-800">{breadcrumb}</h1> : null}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}