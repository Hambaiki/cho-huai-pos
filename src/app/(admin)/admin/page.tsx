import { PageHeader } from "@/components/content/PageHeader";
import {
  SectionCard,
  SectionCardBody,
  SectionCardHeader,
} from "@/components/content/SectionCard";
import { StatCard } from "@/components/content/StatCard";
import { getAdminDashboardStats } from "@/features/admin/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { formatNumberThai } from "@/lib/utils/format";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  ShoppingCart,
  Store,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const {
    storeCount,
    userCount,
    orderCount,
    pendingCount,
    totalRevenue,
    bnplOutstanding,
    recentStores,
    recentUsers,
  } = await getAdminDashboardStats();

  return (
    <section className="space-y-6">
      <PageHeader title="Admin Dashboard" description="System-wide overview" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total Stores" value={storeCount ?? 0} icon={Store} />
        <StatCard label="Total Users" value={userCount ?? 0} icon={Users} />
        <StatCard
          label="Completed Orders"
          value={orderCount ?? 0}
          icon={ShoppingCart}
        />
        <StatCard
          label="Total Revenue"
          value={`฿${formatNumberThai(totalRevenue)}`}
          subLabel="Completed orders only"
          icon={Banknote}
        />
        <StatCard
          label="BNPL Outstanding"
          value={`฿${formatNumberThai(bnplOutstanding)}`}
          subLabel="Active & frozen accounts"
          icon={CreditCard}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingCount ?? 0}
          subLabel="Awaiting access"
          icon={Clock}
          tone={(pendingCount ?? 0) > 0 ? "danger" : "default"}
        />
      </div>

      {/* Recent rows */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Stores */}
        <SectionCard>
          <SectionCardHeader
            title="Recent Stores"
            description="5 most recently created"
            headerRight={
              <Link
                href="/admin/stores"
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            }
          />
          <SectionCardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Currency</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentStores.map((store) => (
                  <tr
                    key={store.id}
                    className="border-b border-neutral-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-neutral-800">
                      {store.name}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">
                      {store.currency_code}
                    </td>
                    <td className="px-4 py-2.5">
                      {store.is_suspended ? (
                        <span className="inline-flex items-center gap-1 text-xs text-danger-600">
                          <XCircle size={12} /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-success-600">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-400">
                      {new Date(store.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentStores.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-neutral-400"
                    >
                      No stores yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SectionCardBody>
        </SectionCard>

        {/* Recent Users */}
        <SectionCard>
          <SectionCardHeader
            title="Recent Users"
            description="5 most recently registered"
            headerRight={
              <Link
                href="/admin/users"
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            }
          />
          <SectionCardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Access</th>
                  <th className="px-4 py-2 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-b border-neutral-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-neutral-800">
                      {profile.display_name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {profile.is_suspended ? (
                        <span className="inline-flex items-center gap-1 text-xs text-danger-600">
                          <XCircle size={12} /> Suspended
                        </span>
                      ) : profile.is_provisioned ? (
                        <span className="inline-flex items-center gap-1 text-xs text-warning-600">
                          <Info size={12} /> Active, provisioned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-success-600">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-400">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-neutral-400"
                    >
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SectionCardBody>
        </SectionCard>
      </div>
    </section>
  );
}
