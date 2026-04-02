import { createClient } from "@/lib/supabase/server";

export async function getStoreDashboardData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership) return null;

  const { data: store } = await supabase
    .from("stores")
    .select(
      "id, currency_code, currency_symbol, currency_decimals, symbol_position",
    )
    .eq("id", storeId)
    .maybeSingle();

  if (!store) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart.getTime() - 1);

  const [
    todayOrdersResult,
    yesterdayOrdersResult,
    recentOrdersResult,
    bnplResult,
    productsResult,
    storeMembersResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, payment_method")
      .eq("store_id", store.id)
      .eq("status", "completed")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", store.id)
      .eq("status", "completed")
      .gte("created_at", yesterdayStart.toISOString())
      .lte("created_at", yesterdayEnd.toISOString()),
    supabase
      .from("orders")
      .select("id, total, status, payment_method, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("bnpl_accounts")
      .select("id, balance_due")
      .eq("store_id", store.id)
      .eq("status", "active"),
    supabase
      .from("products")
      .select("id, stock_qty, low_stock_at, is_active")
      .eq("store_id", store.id),
    supabase.from("store_members").select("id").eq("store_id", store.id),
  ]);

  return {
    role: membership.role,
    store,
    now,
    todayOrders: todayOrdersResult.data ?? [],
    yesterdayOrders: yesterdayOrdersResult.data ?? [],
    recentOrders: recentOrdersResult.data ?? [],
    bnplAccounts: bnplResult.data ?? [],
    products: productsResult.data ?? [],
    storeMembers: storeMembersResult.data ?? [],
  };
}
