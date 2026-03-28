import { createClient } from "@/lib/supabase/server";

import { DEFAULT_CURRENCY } from "@/lib/utils/currency";
import type { ReportOrder, ReportOrderItem, OverdueInstallment } from "@/lib/utils/reports";

export async function getReportsPageData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select(
      "store_id, stores(currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership?.store_id) return null;

  const currency = membership.stores ?? DEFAULT_CURRENCY;

  // Fetch 60 days of data to cover both current and previous 30-day windows
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - 59);
  since.setHours(0, 0, 0, 0);

  const [
    { data: completedOrders },
    { data: completedOrderItems },
    { data: bnplSummary },
    { data: overdueInstallments },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, payment_method, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", since.toISOString()),

    supabase
      .from("order_items")
      .select(
        "product_name, quantity, subtotal, unit_cost, orders!inner(store_id, status, created_at)",
      )
      .eq("orders.store_id", storeId)
      .eq("orders.status", "completed")
      .gte("orders.created_at", since.toISOString()),

    supabase
      .from("bnpl_accounts")
      .select("status, balance_due, credit_limit")
      .eq("store_id", storeId),

    supabase
      .from("bnpl_installments")
      .select(
        "id, amount, due_date, account_id, bnpl_accounts!inner(store_id, customer_name)",
      )
      .eq("bnpl_accounts.store_id", storeId)
      .eq("status", "pending")
      .lt("due_date", now.toISOString().slice(0, 10)),
  ]);

  return {
    currency,
    completedOrders: (completedOrders ?? []) as ReportOrder[],
    completedOrderItems: (completedOrderItems ?? []) as unknown as ReportOrderItem[],
    bnplSummary: bnplSummary ?? [],
    overdueInstallments: (overdueInstallments ?? []) as unknown as OverdueInstallment[],
  };
}
