import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";
import { PaginatedOrderRow } from "./types";

export async function getPaginatedOrdersData({
  userId,
  storeId,
  query,
  statuses,
  methods,
  page,
  pageSize,
}: {
  userId: string;
  storeId: string;
  query: string;
  statuses: string[];
  methods: string[];
  page: number;
  pageSize: number;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select(
      "store_id, role, stores(currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership?.store_id) return null;

  const currency = membership.stores ?? DEFAULT_CURRENCY;

  const { data: orders } = await supabase.rpc("paginated_orders", {
    p_store_id: storeId,
    p_query: query || undefined,
    p_statuses: statuses.length > 0 ? statuses : undefined,
    p_methods: methods.length > 0 ? methods : undefined,
    p_page: page,
    p_page_size: pageSize,
  });

  const orderRows = (orders ?? []) as PaginatedOrderRow[];
  const totalItems = orderRows[0]?.total_count ?? 0;

  return {
    currency,
    orders: orderRows.map((o) => ({
      id: o.id,
      total: o.total,
      payment_method: o.payment_method,
      status: o.status,
      created_at: o.created_at,
      cashier_id: o.cashier_id,
    })),
    totalItems,
  };
}

export async function getOrderDetailData({
  userId,
  storeId,
  orderId,
}: {
  userId: string;
  storeId: string;
  orderId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select(
      "store_id, role, stores(currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership?.store_id) return null;

  const currency = membership.stores ?? DEFAULT_CURRENCY;
  const isManager = ["owner", "manager"].includes(membership.role);

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `*, qr_channels(label), order_items(product_name, quantity, unit_price, discount, subtotal)`,
    )
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    currency,
    isManager,
    order,
  };
}
