import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";
import type { BnplAccountSummary } from "./types";

/**
 * Fetch BNPL account detail page data for a store member.
 * Returns normalized values ready for rendering.
 */
export async function getBnplAccountDetailData({
  userId,
  storeId,
  accountId,
}: {
  userId: string;
  storeId: string;
  accountId: string;
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

  const membershipInfo = membership
    ? {
        store_id: membership.store_id,
        role: membership.role,
      }
    : null;

  const isManager =
    membership?.role === "owner" || membership?.role === "manager";

  const storeCurrency = membership?.stores;
  const currency = storeCurrency ?? DEFAULT_CURRENCY;

  const [{ data: account }, { data: installments }, { data: qrChannels }] =
    await Promise.all([
      supabase
        .from("bnpl_accounts")
        .select(
          "id, customer_name, customer_phone, credit_limit, balance_due, status, notes, created_at",
        )
        .eq("id", accountId)
        .eq("store_id", storeId)
        .maybeSingle(),
      supabase
        .from("bnpl_installments")
        .select("id, amount, due_date, status")
        .eq("account_id", accountId)
        .order("due_date", { ascending: true }),
      supabase
        .from("qr_channels")
        .select("id, label, image_url, is_enabled")
        .eq("store_id", storeId)
        .eq("is_enabled", true)
        .order("sort_order", { ascending: true }),
    ]);

  return {
    membership: membershipInfo,
    isManager,
    currency,
    account: account
      ? {
          id: account.id,
          customer_name: account.customer_name,
          customer_phone: account.customer_phone,
          credit_limit: Number(account.credit_limit),
          balance_due: Number(account.balance_due),
          status: account.status,
          notes: account.notes,
          created_at: account.created_at ?? "",
        }
      : null,
    installments: (installments ?? []).map((inst) => ({
      id: inst.id,
      amount: Number(inst.amount),
      due_date: inst.due_date,
      status: inst.status,
    })),
    qrChannels: qrChannels ?? [],
  };
}

type PaginatedBnplAccountRow = BnplAccountSummary & { total_count: number };

/**
 * Fetch paginated BNPL accounts with currency and membership access info.
 */
export async function getPaginatedBnplAccountsData({
  userId,
  storeId,
  query,
  statuses,
  balanceStatuses,
  page,
  pageSize,
}: {
  userId: string;
  storeId: string;
  query: string;
  statuses: string[];
  balanceStatuses: string[];
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

  const currency = membership?.stores ?? DEFAULT_CURRENCY;
  const isManager =
    membership?.role === "owner" || membership?.role === "manager";

  const { data: accounts } = await supabase.rpc("paginated_bnpl_accounts", {
    p_store_id: storeId,
    p_query: query || undefined,
    p_statuses: statuses.length > 0 ? statuses : undefined,
    p_balance_statuses:
      balanceStatuses.length > 0 ? balanceStatuses : undefined,
    p_page: page,
    p_page_size: pageSize,
  });

  const accountRows = (accounts ?? []) as PaginatedBnplAccountRow[];
  const totalItems = accountRows[0]?.total_count ?? 0;

  return {
    membership,
    isManager,
    currency,
    accounts: accountRows.map((account) => ({
      id: account.id,
      customer_name: account.customer_name,
      customer_phone: account.customer_phone,
      credit_limit: account.credit_limit,
      balance_due: account.balance_due,
      status: account.status,
      notes: account.notes,
      created_at: account.created_at,
    })),
    totalItems,
  };
}
