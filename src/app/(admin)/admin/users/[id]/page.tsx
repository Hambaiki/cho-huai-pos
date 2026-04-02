import { PageHeader } from "@/components/content/PageHeader";
import { StatCard } from "@/components/content/StatCard";
import {
  getUserLinkedDataSummary,
  getUserProfileById,
} from "@/features/admin/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { formatNumber } from "@/lib/utils/format";
import { formatLabel, formatValue } from "@/lib/utils/format";
import { Receipt, Store, Users, Wallet } from "lucide-react";
import { notFound, redirect } from "next/navigation";

interface AdminUserDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailsPage({
  params,
}: AdminUserDetailsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [profile, linkedSummary] = await Promise.all([
    getUserProfileById(id),
    getUserLinkedDataSummary(id),
  ]);

  if (!profile) {
    notFound();
  }

  const entries = Object.entries(profile).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="space-y-6">
      <PageHeader
        title={profile.display_name || "User details"}
        description="Full user details for super admin review"
        backHref="/admin/users"
        backLabel="Back to users"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Store Memberships"
          value={formatNumber(linkedSummary.membershipCount)}
          icon={Users}
        />
        <StatCard
          label="Owned Stores"
          value={formatNumber(linkedSummary.ownedStoreCount)}
          icon={Store}
        />
        <StatCard
          label="Cashier Orders"
          value={formatNumber(linkedSummary.cashierOrderCount)}
          icon={Receipt}
        />
        <StatCard
          label="Cashier Sales Total"
          value={formatNumber(linkedSummary.cashierSalesTotal, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
          icon={Wallet}
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
