import { createClient } from "@/lib/supabase/server";
import {
  AdminDashboardStats,
  AdminStoreLinkedDataSummary,
  AdminUserLinkedDataSummary,
} from "./types";

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
 * Fetch full details for a single user profile.
 */
export async function getUserProfileById(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user details: ${error.message}`);
  }

  return profile;
}

/**
 * Fetch linked user data summary for super admin visibility.
 */
export async function getUserLinkedDataSummary(
  userId: string,
): Promise<AdminUserLinkedDataSummary> {
  const supabase = await createClient();

  const [membershipCountResult, ownedStoreCountResult, cashierOrdersResult] =
    await Promise.all([
      supabase
        .from("store_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
      supabase.from("orders").select("id, total").eq("cashier_id", userId),
    ]);

  if (membershipCountResult.error) {
    throw new Error(
      `Failed to fetch user memberships: ${membershipCountResult.error.message}`,
    );
  }

  if (ownedStoreCountResult.error) {
    throw new Error(
      `Failed to fetch owned stores count: ${ownedStoreCountResult.error.message}`,
    );
  }

  if (cashierOrdersResult.error) {
    throw new Error(
      `Failed to fetch cashier orders: ${cashierOrdersResult.error.message}`,
    );
  }

  return {
    membershipCount: membershipCountResult.count ?? 0,
    ownedStoreCount: ownedStoreCountResult.count ?? 0,
    cashierOrderCount: (cashierOrdersResult.data ?? []).length,
    cashierSalesTotal: (cashierOrdersResult.data ?? []).reduce(
      (sum, order) => sum + Number(order.total ?? 0),
      0,
    ),
  };
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

/**
 * Fetch full details for a single store.
 */
export async function getStoreById(storeId: string) {
  const supabase = await createClient();

  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch store details: ${error.message}`);
  }

  return store;
}

/**
 * Fetch linked store data summary for super admin visibility.
 */
export async function getStoreLinkedDataSummary(
  storeId: string,
): Promise<AdminStoreLinkedDataSummary> {
  const supabase = await createClient();

  const [
    memberCountResult,
    productCountResult,
    orderCountResult,
    completedRevenueResult,
    bnplAccountCountResult,
    bnplOutstandingResult,
  ] = await Promise.all([
    supabase
      .from("store_members")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", storeId)
      .eq("status", "completed"),
    supabase
      .from("bnpl_accounts")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("bnpl_accounts")
      .select("balance_due")
      .eq("store_id", storeId)
      .in("status", ["active", "frozen"]),
  ]);

  if (memberCountResult.error) {
    throw new Error(`Failed to fetch store members: ${memberCountResult.error.message}`);
  }

  if (productCountResult.error) {
    throw new Error(`Failed to fetch products count: ${productCountResult.error.message}`);
  }

  if (orderCountResult.error) {
    throw new Error(`Failed to fetch orders count: ${orderCountResult.error.message}`);
  }

  if (completedRevenueResult.error) {
    throw new Error(`Failed to fetch completed revenue: ${completedRevenueResult.error.message}`);
  }

  if (bnplAccountCountResult.error) {
    throw new Error(`Failed to fetch BNPL account count: ${bnplAccountCountResult.error.message}`);
  }

  if (bnplOutstandingResult.error) {
    throw new Error(`Failed to fetch BNPL outstanding: ${bnplOutstandingResult.error.message}`);
  }

  return {
    memberCount: memberCountResult.count ?? 0,
    productCount: productCountResult.count ?? 0,
    orderCount: orderCountResult.count ?? 0,
    completedRevenue: (completedRevenueResult.data ?? []).reduce(
      (sum, order) => sum + Number(order.total ?? 0),
      0,
    ),
    bnplAccountCount: bnplAccountCountResult.count ?? 0,
    bnplOutstanding: (bnplOutstandingResult.data ?? []).reduce(
      (sum, account) => sum + Number(account.balance_due ?? 0),
      0,
    ),
  };
}
