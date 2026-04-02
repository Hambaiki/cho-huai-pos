/**
 * Example: Dashboard data fetching with type safety
 *
 * This pattern shows how to organize Supabase queries:
 * 1. Use `createClient()` for full TypeScript support
 * 2. Group related queries into focused functions
 * 3. Return clean types that match your UI needs
 * 4. Handle errors explicitly
 * 5. Call these from Server Components (pages) instead of inline queries
 */

import { createClient } from "@/lib/supabase/server";

interface UserDashboardData {
  displayName: string;
  storeCount: number | null;
}

/**
 * Fetch dashboard data for authenticated user.
 * Combines profile and store info in a single function.
 */
export async function getUserDashboardData(
  userId: string,
): Promise<UserDashboardData> {
  const supabase = await createClient();

  // Fetch profile and store count in parallel
  const [{ data: profile }, { count: storeCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("store_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const displayName = profile?.display_name || userId.split("@")[0] || "there";

  return {
    displayName,
    storeCount,
  };
}

interface StoreData {
  id: string;
  name: string;
  role: "owner" | "manager" | "staff";
}

/**
 * Fetch all stores for a user with their role.
 * Returns typed array of stores.
 */
export async function getUserStores(userId: string): Promise<StoreData[]> {
  const supabase = await createClient();

  const { data: stores, error } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }

  return (stores ?? []).map((member) => ({
    id: member.store_id,
    name: "", // You'd join with stores table if needed
    role: member.role as "owner" | "manager" | "staff",
  }));
}

/**
 * Fetch store details with type safety.
 */
export async function getStoreDetails(storeId: string) {
  const supabase = await createClient();

  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, description, created_at")
    .eq("id", storeId)
    .single();

  if (error || !store) {
    throw new Error("Store not found");
  }

  return store;
}

/**
 * Fetch user's store memberships with full store details.
 * Used by StoresHubPage to display user's accessible stores.
 */
export async function getUserStoresMemberships(userId: string) {
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("store_members")
    .select("role, stores(id, name, address, is_suspended, created_at)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch store memberships: ${error.message}`);
  }

  return memberships ?? [];
}
