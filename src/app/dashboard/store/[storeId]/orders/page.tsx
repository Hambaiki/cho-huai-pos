import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrdersPageClient } from "@/components/orders/OrdersPageClient";
import type { CurrencyStore } from "@/lib/utils/currency";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 10;

type OrdersSearchParams = {
  page?: string;
  query?: string;
  statuses?: string;
  methods?: string;
};

type OrderRow = {
  id: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  cashier_id: string | null;
  total_count: number;
};

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<OrdersSearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePage(resolvedSearchParams.page);
  const query = resolvedSearchParams.query?.trim() ?? "";
  const statuses = parseList(resolvedSearchParams.statuses);
  const methods = parseList(resolvedSearchParams.methods);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("store_members")
    .select(
      "store_id, role, stores(currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .single();

  if (!membership?.store_id) redirect("/dashboard");

  const storeInfo = membership.stores as unknown as CurrencyStore;
  const currency: CurrencyStore = {
    currency_code: storeInfo.currency_code,
    currency_symbol: storeInfo.currency_symbol,
    currency_decimals: storeInfo.currency_decimals,
    symbol_position: storeInfo.symbol_position,
  };

  const { data: orders } = await supabase.rpc("paginated_orders", {
    p_store_id: storeId,
    p_query: query || null,
    p_statuses: statuses.length > 0 ? statuses : null,
    p_methods: methods.length > 0 ? methods : null,
    p_page: currentPage,
    p_page_size: PAGE_SIZE,
  });

  const orderRows = (orders ?? []) as OrderRow[];
  const totalItems = orderRows[0]?.total_count ?? 0;

  return (
    <OrdersPageClient
      orders={orderRows.map((order) => ({
        id: order.id,
        total: order.total,
        payment_method: order.payment_method,
        status: order.status,
        created_at: order.created_at,
        cashier_id: order.cashier_id,
      }))}
      currency={currency}
      storeId={storeId}
      currentPage={currentPage}
      totalItems={totalItems}
      pageSize={PAGE_SIZE}
      initialQuery={query}
      initialStatuses={statuses}
      initialMethods={methods}
    />
  );
}
