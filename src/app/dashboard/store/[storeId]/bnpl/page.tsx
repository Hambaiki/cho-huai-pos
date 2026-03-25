import { redirect } from "next/navigation";
import { BnplAccountsPageClient } from "@/components/bnpl/BnplAccountsPageClient";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyStore } from "@/lib/utils/currency";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

export const metadata = { title: "BNPL Accounts" };

const PAGE_SIZE = 10;

type BnplSearchParams = {
  page?: string;
  query?: string;
  statuses?: string;
  balanceStatuses?: string;
};

type AccountRow = BnplAccountSummary & { total_count: number };

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

export default async function BnplPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<BnplSearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePage(resolvedSearchParams.page);
  const query = resolvedSearchParams.query?.trim() ?? "";
  const statuses = parseList(resolvedSearchParams.statuses);
  const balanceStatuses = parseList(resolvedSearchParams.balanceStatuses);

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

  const { data: accounts } = await supabase.rpc("paginated_bnpl_accounts", {
    p_store_id: storeId,
    p_query: query || null,
    p_statuses: statuses.length > 0 ? statuses : null,
    p_balance_statuses: balanceStatuses.length > 0 ? balanceStatuses : null,
    p_page: currentPage,
    p_page_size: PAGE_SIZE,
  });

  const isManager = ["owner", "manager"].includes(membership.role);
  const accountRows = (accounts ?? []) as AccountRow[];
  const totalItems = accountRows[0]?.total_count ?? 0;

  return (
    <BnplAccountsPageClient
      accounts={accountRows.map((account) => ({
        id: account.id,
        customer_name: account.customer_name,
        phone: account.phone,
        credit_limit: account.credit_limit,
        balance_due: account.balance_due,
        status: account.status,
        notes: account.notes,
        created_at: account.created_at,
      }))}
      currency={currency}
      isManager={isManager}
      storeId={storeId}
      currentPage={currentPage}
      totalItems={totalItems}
      pageSize={PAGE_SIZE}
      initialQuery={query}
      initialStatuses={statuses}
      initialBalanceStatuses={balanceStatuses}
    />
  );
}
