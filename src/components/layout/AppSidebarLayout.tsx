"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Coins,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

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
  subtitle?: string;
  navSections: AppSidebarNavSection[];
  getBreadcrumbs: (pathname: string) => BreadcrumbItem[];
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
  getBreadcrumbs,
  footerLinks = [],
  children,
}: AppSidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compactExpanded, setCompactExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-brand-800 bg-brand-700 px-4 py-4">
        <div className="flex items-center">
          <Coins size={30} className="mr-2 text-white" />
          <p
            className={cn(
              "overflow-hidden whitespace-nowrap text-lg font-black uppercase tracking-widest text-white transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
              !compactExpanded &&
                "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
            )}
          >
            Cho-Huai POS
          </p>
          <p
            className={cn(
              "mt-1 overflow-hidden whitespace-nowrap text-sm font-medium text-neutral-600 transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
              !compactExpanded &&
                "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
            )}
          >
            {subtitle}
          </p>
        </div>
        <Button
          type="button"
          variant="ghostDark"
          size="icon-sm"
          onClick={() => setSidebarOpen(false)}
          className="text-white md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="hidden border-b border-brand-800 px-2 py-3 md:block xl:hidden">
        <Button
          type="submit"
          variant="ghostDark"
          onClick={() => setCompactExpanded((prev) => !prev)}
          aria-label="Collapse sidebar"
          className="h-auto w-full justify-start gap-3 px-3 py-3"
        >
          {compactExpanded ? (
            <PanelLeftClose size={20} className="shrink-0" />
          ) : (
            <PanelLeftOpen size={20} className="shrink-0" />
          )}
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
              !compactExpanded &&
                "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
            )}
          >
            {compactExpanded ? "Collapse" : "Expand"}
          </span>
        </Button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto scrollbar-none px-2 py-3">
        {navSections.map((section, index) => (
          <div key={section.title ?? `section-${index}`}>
            {section.title ? (
              <p
                className={cn(
                  "overflow-hidden whitespace-nowrap px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-100 transition-opacity duration-200 ease-out md:min-h-5 md:opacity-100",
                  !compactExpanded && "md:opacity-0 xl:opacity-100",
                )}
              >
                {section.title}
              </p>
            ) : null}
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActiveNavItem(pathname, {
                  href,
                  label,
                  icon: Icon,
                  exact,
                });

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    aria-label={label}
                    title={label}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-sm text-neutral-50",
                      "hover:bg-neutral-700/10 active:bg-neutral-700/20 hover:text-white",
                      active &&
                        "bg-neutral-700/30 hover:bg-neutral-700/40 text-white",
                      "transition-colors duration-200 ease-out",
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
                        !compactExpanded &&
                          "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {footerLinks.length > 0 && (
        <div className="border-t border-brand-800 px-2 py-3">
          {footerLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              aria-label={label}
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 font-medium text-sm text-neutral-50",
                "hover:bg-neutral-700/10 active:bg-neutral-700/20 hover:text-white",
                "transition-colors duration-200 ease-out",
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
                  !compactExpanded &&
                    "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
                )}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="border-t border-brand-800 px-2 py-3">
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghostDark"
            onClick={() => setSidebarOpen(false)}
            aria-label="Logout"
            className="h-auto w-full justify-start gap-3 px-3 py-3"
          >
            <LogOut size={20} className="shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
                !compactExpanded &&
                  "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
              )}
            >
              Logout
            </span>
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh overflow-hidden bg-white text-neutral-900">
      <aside
        className={cn(
          "hidden border-r border-brand-800 bg-brand-700 md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:flex-col md:w-16 xl:w-56 md:transition-[width] md:duration-300 md:ease-in-out",
          compactExpanded && "md:w-56",
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 flex md:hidden",
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
            "relative z-50 flex w-64 flex-col bg-brand-700 shadow-xl transition-transform duration-250 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </aside>
      </div>

      <div
        className={cn(
          "flex h-dvh min-w-0 flex-1 flex-col pt-14 md:pl-16 xl:pl-56",
        )}
      >
        <header
          className={cn(
            "fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-brand-800 bg-brand-700 px-6 md:right-0 md:left-16 xl:left-56",
          )}
        >
          <Button
            type="button"
            variant="ghostDark"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            className="text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>

          {breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 flex-1 items-center gap-1 text-sm"
            >
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-white/70"
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className={cn(
                        "truncate font-semibold text-white hover:text-white/80",
                        "transition-colors duration-200 ease-out",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate font-semibold text-white">
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              ))}
            </nav>
          )}

          {userEmail && (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden max-w-40 truncate text-sm text-white sm:block">
                {userEmail}
              </span>
              <div
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold uppercase text-white"
              >
                {userEmail.charAt(0)}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
