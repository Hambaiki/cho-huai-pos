import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/login", "/signup"];
const publicRoutes = ["/confirm-email", "/maintenance"];
const protectedRoutes = [
  "/access-pending",
  "/dashboard",
  "/onboarding",
  "/admin",
];

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_suspended, is_super_admin")
      .eq("id", user.id)
      .maybeSingle();

    const profile = data as {
      is_suspended?: boolean;
      is_super_admin?: boolean;
    } | null;
    const isSuspended = Boolean(profile?.is_suspended);
    const isSuperAdmin = Boolean(profile?.is_super_admin);

    if (!isAuthRoute && !isPublicRoute) {
      const { data: maintenanceSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      const isMaintenanceMode = maintenanceSetting?.value === "true";
      if (
        isMaintenanceMode &&
        !isSuperAdmin &&
        !pathname.startsWith("/maintenance")
      ) {
        const maintenanceUrl = request.nextUrl.clone();
        maintenanceUrl.pathname = "/maintenance";
        maintenanceUrl.searchParams.delete("next");
        return NextResponse.redirect(maintenanceUrl);
      }
    }

    if (
      isSuspended &&
      !isSuperAdmin &&
      !pathname.startsWith("/access-pending")
    ) {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = "/access-pending";
      pendingUrl.searchParams.delete("next");
      return NextResponse.redirect(pendingUrl);
    }

    if (!isSuspended && pathname.startsWith("/access-pending")) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.searchParams.delete("next");
      return NextResponse.redirect(dashboardUrl);
    }

    if (isAuthRoute) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname =
        isSuspended && !isSuperAdmin ? "/access-pending" : "/dashboard";
      dashboardUrl.searchParams.delete("next");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Admin route — require is_super_admin flag
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_super_admin) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
