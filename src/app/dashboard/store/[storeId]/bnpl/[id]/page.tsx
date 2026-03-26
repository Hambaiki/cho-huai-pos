import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import AccountStatusControl from "@/components/bnpl/AccountStatusControl";
import InstallmentList from "@/components/bnpl/InstallmentList";
import AddInstallmentForm from "@/components/bnpl/AddInstallmentForm";
import { PageHeader } from "@/components/ui/PageHeader";
import type { QrChannel } from "@/components/pos/QrPaymentScreen";

export const metadata = { title: "BNPL Account" };

export default async function BnplAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string; storeId: string }>;
}) {
  const { id: accountId, storeId } = await params;
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

  const isManager = ["owner", "manager"].includes(membership.role);

  const [{ data: account }, { data: installments }, { data: qrChannels }] =
    await Promise.all([
      supabase
        .from("bnpl_accounts")
        .select(
          "id, customer_name, phone:customer_phone, credit_limit, balance_due, status, notes, created_at",
        )
        .eq("id", accountId)
        .eq("store_id", storeId)
        .single(),
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
        .order("sort_order", { ascending: true })
        .returns<QrChannel[]>(),
    ]);

  if (!account) notFound();

  const available = Number(account.credit_limit) - Number(account.balance_due);

  const backHref = `/dashboard/store/${storeId}/bnpl`;

  return (
    <section className="space-y-6">
      <PageHeader
        title={account.customer_name}
        description={account.phone ?? undefined}
        backHref={backHref}
        backLabel="Back to BNPL"
      />

      {/* Summary card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
          <p className="text-xs text-neutral-500 uppercase font-semibold">
            Credit Limit
          </p>
          <p className="text-xl font-bold text-neutral-900 mt-1">
            {formatCurrency(Number(account.credit_limit), currency)}
          </p>
        </div>
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
          <p className="text-xs text-danger-500 uppercase font-semibold">
            Balance Due
          </p>
          <p className="text-xl font-bold text-danger-700 mt-1">
            {formatCurrency(Number(account.balance_due), currency)}
          </p>
        </div>
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3">
          <p className="text-xs text-success-600 uppercase font-semibold">
            Available
          </p>
          <p className="text-xl font-bold text-success-700 mt-1">
            {formatCurrency(available, currency)}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">
          Account Status
        </span>
        {isManager ? (
          <AccountStatusControl
            accountId={account.id}
            storeId={storeId}
            currentStatus={account.status}
          />
        ) : (
          <span className="text-sm capitalize text-neutral-600">
            {account.status}
          </span>
        )}
      </div>

      {account.notes && (
        <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
          <p className="text-xs text-neutral-500 uppercase font-semibold mb-1">
            Notes
          </p>
          <p className="text-sm text-neutral-700">{account.notes}</p>
        </div>
      )}

      {/* Installments */}
      <InstallmentList
        installments={
          (installments ?? []) as Array<{
            id: string;
            amount: number;
            due_date: string;
            status: "pending" | "paid" | "waived";
          }>
        }
        accountId={accountId}
        storeId={storeId}
        accountBalanceDue={Number(account.balance_due)}
        currency={currency}
        isManager={isManager}
        qrChannels={qrChannels ?? []}
      />

      {/* Add installment */}
      {isManager && account.status === "active" && (
        <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
          <h2 className="font-semibold text-neutral-800 mb-4">
            Add Installment
          </h2>
          <AddInstallmentForm accountId={accountId} storeId={storeId} />
        </div>
      )}
    </section>
  );
}
