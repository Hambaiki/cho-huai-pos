/**
 * Authentication-related queries
 */

import { createTypedServerClient } from "@/lib/supabase/typed-client";

/**
 * Get current authenticated user, or null if not authenticated.
 * Safe to call from anywhere - returns null instead of throwing.
 */
export async function getCurrentUser() {
  const supabase = await createTypedServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current user with additional profile info.
 * Throws if not authenticated.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require current user to be a super admin.
 * Throws if not authenticated or not a super admin.
 * Used for admin panel layout and page guards.
 */
export async function requireSuperAdminUser() {
  const supabase = await createTypedServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_super_admin) {
    throw new Error("Super admin access required");
  }

  return { user, profile };
}
