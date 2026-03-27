import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import AccountStatusControl from "@/components/bnpl/AccountStatusControl";
import InstallmentList from "@/components/bnpl/InstallmentList";
import AddInstallmentModal from "@/components/bnpl/AddInstallmentModal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SectionCard,
  SectionCardBody,
  SectionCardHeader,
} from "@/components/ui/SectionCard";
import type { QrChannel } from "@/components/pos/QrPaymentScreen";

export const metadata = { title: "BNPL Account" };

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: "bg-success-100 text-success-700",
  frozen: "bg-warning-100 text-warning-700",
  closed: "bg-neutral-100 text-neutral-600",
  settled: "bg-brand-100 text-brand-700",
};

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

  const typedInstallments = (installments ?? []) as Array<{
    id: string;
    amount: number;
    due_date: string;
    status: "pending" | "paid" | "waived";
  }>;

  const available = Number(account.credit_limit) - Number(account.balance_due);
  const overdueCount = typedInstallments.filter(
    (inst) => inst.status === "pending" && new Date(inst.due_date) < new Date(),
  ).length;

  const backHref = `/dashboard/store/${storeId}/bnpl`;

  return (
    <section className="space-y-6">
      <PageHeader
        title={account.customer_name}
        description={
          [
            account.phone ? `Phone: ${account.phone}` : null,
            `Opened: ${new Date(account.created_at).toLocaleDateString()}`,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        backHref={backHref}
        backLabel="Back to BNPL"
        meta={
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE_STYLES[account.status] ?? "bg-neutral-100 text-neutral-600"}`}
          >
            {account.status}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Credit Limit</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatCurrency(Number(account.credit_limit), currency)}
          </p>
        </div>
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
          <p className="text-xs text-danger-500">Balance Due</p>
          <p className="mt-1 text-2xl font-semibold text-danger-700">
            {formatCurrency(Number(account.balance_due), currency)}
          </p>
        </div>
        <div className="rounded-lg border border-success-200 bg-success-50 p-4">
          <p className="text-xs text-success-600">Available</p>
          <p className="mt-1 text-2xl font-semibold text-success-700">
            {formatCurrency(available, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Installments</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {typedInstallments.length}
          </p>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
          {overdueCount} overdue installment{overdueCount > 1 ? "s" : ""}{" "}
          requires attention.
        </div>
      )}

      <SectionCard>
        <SectionCardHeader
          title="Account Status"
          description="Manage the current account lifecycle state."
        />
        <SectionCardBody className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-700">
            Current status
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
        </SectionCardBody>
      </SectionCard>

      {account.notes && (
        <SectionCard>
          <SectionCardHeader title="Notes" />
          <SectionCardBody>
            <p className="text-sm text-neutral-700">{account.notes}</p>
          </SectionCardBody>
        </SectionCard>
      )}

      <InstallmentList
        installments={typedInstallments}
        accountId={accountId}
        storeId={storeId}
        accountBalanceDue={Number(account.balance_due)}
        currency={currency}
        isManager={isManager}
        qrChannels={qrChannels ?? []}
      />

      {isManager && account.status === "active" && (
        <SectionCard>
          <SectionCardHeader
            title="Add Installment"
            description="Create a new installment without leaving this page."
          />
          <SectionCardBody className="flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">
              Open the modal to set amount and due date.
            </p>
            <AddInstallmentModal accountId={accountId} storeId={storeId} />
          </SectionCardBody>
        </SectionCard>
      )}
    </section>
  );
}
