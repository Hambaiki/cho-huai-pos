import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const requestCookies = request.cookies.getAll();

  requestCookies
    .filter(({ name }) => name.startsWith("sb-"))
    .forEach(({ name }) => {
      request.cookies.delete(name);
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
      });
    });
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase middleware environment variables.");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { response, user, supabase };
  } catch {
    // Stale/invalid auth cookies can trigger refresh_token_not_found.
    // Clear Supabase cookies and continue as signed out.
    clearSupabaseAuthCookies(request, response);
    return { response, user: null, supabase };
  }
}
