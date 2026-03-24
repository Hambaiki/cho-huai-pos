import { redirect } from "next/navigation";
import { BnplAccountsPageClient } from "@/components/bnpl/BnplAccountsPageClient";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyStore } from "@/lib/utils/currency";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

export const metadata = { title: "BNPL Accounts" };

export default async function BnplPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

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

  const { data: accounts } = await supabase
    .from("bnpl_accounts")
    .select(
      "id, customer_name, phone:customer_phone, credit_limit, balance_due, status, notes, created_at",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const isManager = ["owner", "manager"].includes(membership.role);

  return (
    <BnplAccountsPageClient
      accounts={(accounts ?? []) as BnplAccountSummary[]}
      currency={currency}
      isManager={isManager}
      storeId={storeId}
    />
  );
}
