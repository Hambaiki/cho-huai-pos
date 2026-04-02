import { createClient } from "@/lib/supabase/server";

/**
 * Get current authenticated user, or null if not authenticated.
 * Safe to call from anywhere - returns null instead of throwing.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

/**
 * Get user's access/approval status.
 * Returns profile data for is_suspended and is_super_admin flags.
 */
export async function getUserAccessStatus(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_suspended, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to fetch access status");
  }

  return profile;
}

/**
 * Get user's profile for account settings page.
 * Returns display name and created date.
 */
export async function getUserProfileForSettings(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to fetch user profile");
  }

  return profile;
}

/**
 * Get current user with their super admin status.
 * Returns { user, isSuperAdmin } or throws if not authenticated.
 * Used by dashboard layouts to determine admin menu visibility.
 */
export async function getCurrentUserAdminStatus() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    isSuperAdmin: Boolean(profile?.is_super_admin),
  };
}
