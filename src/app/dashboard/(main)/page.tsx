import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store,
  UserCog,
  ShoppingCart,
  Package,
  CreditCard,
  BarChart2,
} from "lucide-react";
import { getCurrentUserAdminStatus } from "@/lib/queries/auth";
import { getUserDashboardData } from "@/lib/queries/dashboard";
import { QuickLinkCard } from "@/components/dashboard/QuickLinkCard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await getCurrentUserAdminStatus();

  if (!user) redirect("/login");

  const { displayName, storeCount } = await getUserDashboardData(user.id);

  const storeLabel =
    storeCount == null
      ? "Manage your stores"
      : `${storeCount} store${storeCount !== 1 ? "s" : ""} in your workspace`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Welcome back, {displayName}!
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choose where you&apos;d like to go from here.
        </p>
      </div>

      {/* Workspace */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Workspace
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLinkCard
            href="/dashboard/stores"
            icon={<Store size={20} />}
            title="Your Stores"
            description={storeLabel}
          />
          <QuickLinkCard
            href="/dashboard/account"
            icon={<UserCog size={20} />}
            title="Account Settings"
            description="Update your profile and preferences"
            accent="bg-neutral-100 text-neutral-600"
          />
        </div>
      </section>

      {/* Inside a store */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Inside a Store
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          Open a store from{" "}
          <Link
            href="/dashboard/stores"
            className="font-medium text-brand-600 hover:underline"
          >
            Your Stores
          </Link>{" "}
          to access these sections.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <ShoppingCart size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-700">POS</p>
              <p className="text-xs text-neutral-400">Point of sale</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-600">
              <Package size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-700">
                Inventory
              </p>
              <p className="text-xs text-neutral-400">Products &amp; stock</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <CreditCard size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-700">BNPL</p>
              <p className="text-xs text-neutral-400">
                Buy-now, pay-later accounts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <BarChart2 size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-700">Reports</p>
              <p className="text-xs text-neutral-400">Sales &amp; analytics</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
