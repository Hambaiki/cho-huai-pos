import { PageHeader } from "@/components/content/PageHeader";
import { StatCard } from "@/components/content/StatCard";
import { getStoreById, getStoreLinkedDataSummary } from "@/features/admin/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { formatCurrency } from "@/lib/utils/currency";
import { formatLabel, formatValue } from "@/lib/utils/format";
import {
  CreditCard,
  Package,
  Receipt,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

interface AdminStoreDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStoreDetailsPage({
  params,
}: AdminStoreDetailsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [store, linkedSummary] = await Promise.all([
    getStoreById(id),
    getStoreLinkedDataSummary(id),
  ]);

  if (!store) {
    notFound();
  }

  const entries = Object.entries(store).sort(([a], [b]) => a.localeCompare(b));
  const currencyStore = {
    currency_symbol: store.currency_symbol,
    currency_code: store.currency_code,
    currency_decimals: store.currency_decimals,
    symbol_position: store.symbol_position,
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={store.name || "Store details"}
        description="Full store details for super admin review"
        backHref="/admin/stores"
        backLabel="Back to stores"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Store Members"
          value={linkedSummary.memberCount}
          icon={Users}
        />
        <StatCard
          label="Inventory Products"
          value={linkedSummary.productCount}
          icon={Package}
        />
        <StatCard
          label="Orders"
          value={linkedSummary.orderCount}
          icon={Receipt}
        />
        <StatCard
          label="Completed Revenue"
          value={formatCurrency(linkedSummary.completedRevenue, currencyStore)}
          icon={Store}
        />
        <StatCard
          label="BNPL Accounts"
          value={linkedSummary.bnplAccountCount}
          icon={CreditCard}
        />
        <StatCard
          label="BNPL Outstanding"
          value={formatCurrency(linkedSummary.bnplOutstanding, currencyStore)}
          icon={Wallet}
          tone={linkedSummary.bnplOutstanding > 0 ? "danger" : "default"}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-200 bg-white">
        <div className="grid grid-cols-1 divide-y divide-border-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {entries.map(([key, value]) => {
            return (
              <div key={key} className="px-4 py-3 border-b border-border-100">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {formatLabel(key)}
                </p>
                <p className="mt-1 break-all text-sm text-neutral-900">
                  {formatValue(value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
