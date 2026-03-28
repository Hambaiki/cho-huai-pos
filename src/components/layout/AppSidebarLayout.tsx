"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

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
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compactExpanded, setCompactExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isExpanded = compactExpanded;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!compactExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (sidebarRef.current?.contains(target)) return;
      setCompactExpanded(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [compactExpanded]);

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col bg-neutral-50",
        "transition",
        isExpanded && "shadow-xl xl:shadow-none",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center justify-between px-4 py-4",
          "border-b border-neutral-200",
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <Logo variant="icon" size="sm" />
          <div
            className={cn(
              "overflow-hidden whitespace-nowrap text-lg font-black uppercase tracking-widest transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
              !isExpanded &&
                "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
            )}
          >
            <Logo variant="text-dark" className="h-auto w-20" />
          </div>

          <p
            className={cn(
              "mt-1 overflow-hidden whitespace-nowrap text-sm font-medium text-neutral-600 transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
              !isExpanded &&
                "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
            )}
          >
            {subtitle}
          </p>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(false)}
          className="text-white md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </Button>
      </div>

      <div
        className={cn(
          "hidden p-2 md:block xl:hidden",
          "border-b border-neutral-200",
        )}
      >
        <Button
          type="submit"
          variant="ghost"
          onClick={() => setCompactExpanded((prev) => !prev)}
          aria-label="Collapse sidebar"
          className="h-auto w-full justify-start gap-3 px-3 py-3"
        >
          {compactExpanded ? (
            <ChevronLeft size={20} className="shrink-0" />
          ) : (
            <ChevronRight size={20} className="shrink-0" />
          )}
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
              !isExpanded &&
                "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
            )}
          >
            {compactExpanded ? "Collapse" : "Expand"}
          </span>
        </Button>
      </div>

      <nav
        className={cn("flex-1 space-y-4 overflow-y-auto scrollbar-none p-2")}
      >
        {navSections.map((section, index) => (
          <div key={section.title ?? `section-${index}`}>
            {section.title ? (
              <p
                className={cn(
                  "overflow-hidden whitespace-nowrap px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-opacity duration-200 ease-out md:min-h-5 md:opacity-100",
                  !isExpanded && "md:opacity-0 xl:opacity-100",
                )}
              >
                {section.title}
              </p>
            ) : null}
            <div className={cn("space-y-1")}>
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
                      "flex items-center gap-3 rounded-md px-3 py-3 font-medium text-sm text-neutral-700",
                      "hover:bg-neutral-600/10 active:bg-brand-600/20",
                      active && "bg-brand-600 hover:bg-brand-600 text-white",
                      "transition-colors duration-200 ease-out",
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
                        !isExpanded &&
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
        <div className={cn("p-2", "border-t border-neutral-200")}>
          {footerLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              aria-label={label}
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-md p-3 font-medium text-sm text-neutral-700",
                "hover:bg-neutral-600/10 active:bg-brand-600/20",
                "transition-colors duration-200 ease-out",
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
                  !isExpanded &&
                    "md:max-w-0 md:opacity-0 xl:max-w-40 xl:opacity-100",
                )}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className={cn("p-2", "border-t border-neutral-200")}>
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            onClick={() => setSidebarOpen(false)}
            aria-label="Logout"
            className={cn("h-auto w-full justify-start gap-3 px-3 py-3")}
          >
            <LogOut size={20} className="shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out md:max-w-40 md:opacity-100",
                !isExpanded &&
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
    <div
      className={cn(
        "min-h-dvh overflow-hidden bg-neutral-100 text-neutral-900",
      )}
    >
      <aside
        ref={sidebarRef}
        className={cn(
          "hidden border-r border-neutral-200 bg-neutral-50 md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:flex-col md:w-16 xl:w-56 md:transition-[width] md:duration-300 md:ease-in-out",
          isExpanded && "md:w-56",
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
            "relative z-50 flex w-64 flex-col bg-neutral-50 shadow-xl transition-transform duration-250 ease-out",
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
            "fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-6 md:right-0 md:left-16 xl:left-56",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            className="text-neutral-700 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>

          {breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className={cn("flex min-w-0 flex-1 items-center gap-1 text-sm")}
            >
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-neutral-700/70"
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className={cn(
                        "truncate text-neutral-500 hover:text-neutral-500/80",
                        "transition-colors duration-200 ease-out",
                        index === breadcrumbs.length - 1 &&
                          "font-semibold text-neutral-700",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "truncate text-neutral-500",
                        index === breadcrumbs.length - 1 &&
                          "font-semibold text-neutral-700",
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              ))}
            </nav>
          )}

          {userEmail && (
            <div className={cn("ml-auto flex shrink-0 items-center gap-2")}>
              <span
                className={cn(
                  "hidden max-w-40 truncate text-sm text-neutral-700 sm:block",
                )}
              >
                {userEmail}
              </span>
              <div
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full bg-brand-600",
                  "text-xs font-bold uppercase text-white",
                )}
              >
                {userEmail.charAt(0)}
              </div>
            </div>
          )}
        </header>

        <main className={cn("flex-1 flex flex-col overflow-y-auto p-4 lg:p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
