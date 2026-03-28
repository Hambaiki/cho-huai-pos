/**
 * Admin dashboard queries
 */

import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/lib/supabase/types";

type Store = Database["public"]["Tables"]["stores"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AdminDashboardStats {
  storeCount: number | null;
  userCount: number | null;
  orderCount: number | null;
  pendingCount: number | null;
  totalRevenue: number;
  bnplOutstanding: number;
  recentStores: Pick<
    Store,
    "id" | "name" | "currency_code" | "is_suspended" | "created_at"
  >[];
  recentUsers: Pick<
    Profile,
    "id" | "display_name" | "is_provisioned" | "is_suspended" | "created_at"
  >[];
}

/**
 * Fetch all dashboard statistics in a single parallel request.
 * Includes counts, revenue, and recent items.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [
    storeCountResult,
    userCountResult,
    orderCountResult,
    pendingCountResult,
    revResult,
    bnplResult,
    storesResult,
    usersResult,
  ] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_suspended", true),
    supabase
      .from("orders")
      .select("total.sum()")
      .eq("status", "completed")
      .single(),
    supabase
      .from("bnpl_accounts")
      .select("balance_due.sum()")
      .in("status", ["active", "frozen"])
      .single(),
    supabase
      .from("stores")
      .select("id, name, currency_code, is_suspended, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, display_name, is_provisioned, is_suspended, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const storeCount = storeCountResult.count;
  const userCount = userCountResult.count;
  const orderCount = orderCountResult.count;
  const pendingCount = pendingCountResult.count;

  const totalRevenue = Number(
    (revResult.data as { sum: string | null } | null)?.sum ?? 0,
  );
  const bnplOutstanding = Number(
    (bnplResult.data as { sum: string | null } | null)?.sum ?? 0,
  );

  return {
    storeCount,
    userCount,
    orderCount,
    pendingCount,
    totalRevenue,
    bnplOutstanding,
    recentStores: storesResult.data ?? [],
    recentUsers: usersResult.data ?? [],
  };
}

/**
 * Fetch all user profiles for the admin users page.
 */
export async function getAllUserProfiles() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, is_super_admin, is_suspended, store_limit_override, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user profiles: ${error.message}`);
  }

  return profiles ?? [];
}

/**
 * Fetch all stores for the admin stores page.
 */
export async function getAllStores() {
  const supabase = await createClient();

  const { data: stores, error } = await supabase
    .from("stores")
    .select(
      "id, name, currency_code, is_suspended, staff_limit_override, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }

  return stores ?? [];
}
