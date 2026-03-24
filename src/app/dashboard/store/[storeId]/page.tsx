import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Store Dashboard" };

const ORDER_STATUS_CLASSES: Record<string, string> = {
  completed: "bg-success-100 text-success-700",
  voided: "bg-neutral-100 text-neutral-600",
  refunded: "bg-warning-100 text-warning-700",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  qr_transfer: "QR Transfer",
  card: "Card",
  split: "Split",
  bnpl: "BNPL",
};

function formatDelta(delta: number): string {
  if (delta === 0) return "0%";
  const abs = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
}

export default async function StoreDashboardPage({
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
      "role, stores(id, currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .single();

  if (!membership?.stores) redirect("/dashboard");

  const store = membership.stores as unknown as CurrencyStore & { id: string };
  const basePath = `/dashboard/store/${store.id}`;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart.getTime() - 1);
  const startOf7Days = new Date(todayStart);
  startOf7Days.setDate(todayStart.getDate() - 6);

  const [
    todayOrdersResult,
    yesterdayOrdersResult,
    orders7dResult,
    recentOrdersResult,
    bnplResult,
    productsResult,
    storeMembersResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, payment_method")
      .eq("store_id", store.id)
      .eq("status", "completed")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", store.id)
      .eq("status", "completed")
      .gte("created_at", yesterdayStart.toISOString())
      .lte("created_at", yesterdayEnd.toISOString()),
    supabase
      .from("orders")
      .select("total, created_at")
      .eq("store_id", store.id)
      .eq("status", "completed")
      .gte("created_at", startOf7Days.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase
      .from("orders")
      .select("id, total, status, payment_method, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("bnpl_accounts")
      .select("id, balance_due")
      .eq("store_id", store.id)
      .eq("status", "active"),
    supabase
      .from("products")
      .select("id, stock_qty, low_stock_at, is_active")
      .eq("store_id", store.id),
    supabase.from("store_members").select("id").eq("store_id", store.id),
  ]);

  const todayOrders = todayOrdersResult.data ?? [];
  const yesterdayOrders = yesterdayOrdersResult.data ?? [];
  const orders7d = orders7dResult.data ?? [];
  const recentOrders = recentOrdersResult.data ?? [];
  const bnplAccounts = bnplResult.data ?? [];
  const products = productsResult.data ?? [];
  const storeMembers = storeMembersResult.data ?? [];

  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todayTransactions = todayOrders.length;
  const avgOrderValue = todayTransactions > 0 ? todaySales / todayTransactions : 0;
  const openBnplBalance = bnplAccounts.reduce((sum, a) => sum + Number(a.balance_due), 0);
  const bnplAccountCount = bnplAccounts.length;

  const salesDeltaPct =
    yesterdaySales === 0
      ? todaySales > 0
        ? 100
        : 0
      : ((todaySales - yesterdaySales) / yesterdaySales) * 100;

  const paymentTotals: Record<string, number> = {};
  todayOrders.forEach((order) => {
    paymentTotals[order.payment_method] =
      (paymentTotals[order.payment_method] ?? 0) + Number(order.total);
  });
  const paymentEntries = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1]);

  const dailySales7d = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOf7Days);
    date.setDate(startOf7Days.getDate() + index);
    const key = date.toLocaleDateString("en-CA");
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      fullLabel: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      total: 0,
    };
  });

  orders7d.forEach((order) => {
    const orderKey = new Date(order.created_at).toLocaleDateString("en-CA");
    const day = dailySales7d.find((item) => item.key === orderKey);
    if (day) day.total += Number(order.total);
  });

  const total7d = dailySales7d.reduce((sum, day) => sum + day.total, 0);
  const avgDaily7d = total7d / 7;
  const maxDailySales = dailySales7d.reduce((max, day) => Math.max(max, day.total), 0);

  const activeProducts = products.filter((product) => product.is_active);
  const lowStockProducts = activeProducts.filter(
    (product) =>
      product.low_stock_at !== null &&
      product.stock_qty !== null &&
      Number(product.stock_qty) <= Number(product.low_stock_at),
  );
  const outOfStockProducts = activeProducts.filter(
    (product) => product.stock_qty !== null && Number(product.stock_qty) <= 0,
  );

  const inventoryHealth =
    activeProducts.length === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            ((activeProducts.length - lowStockProducts.length) / activeProducts.length) * 100,
          ),
        );

  const currency: CurrencyStore = {
    currency_code: store.currency_code,
    currency_symbol: store.currency_symbol,
    currency_decimals: store.currency_decimals,
    symbol_position: store.symbol_position,
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 font-medium text-neutral-700">
              Role: <span className="capitalize">{membership.role}</span>
            </span>
            <span
              className={`rounded-full px-3 py-1.5 font-medium ${
                salesDeltaPct > 0
                  ? "bg-success-100 text-success-700"
                  : salesDeltaPct < 0
                    ? "bg-danger-100 text-danger-700"
                    : "bg-neutral-100 text-neutral-600"
              }`}
            >
              vs yesterday: {formatDelta(salesDeltaPct)}
            </span>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Today&apos;s Sales</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {formatCurrency(todaySales, currency)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">Completed orders only</p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Transactions Today</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{todayTransactions}</p>
          <p className="mt-1 text-xs text-neutral-400">
            Avg ticket {formatCurrency(avgOrderValue, currency)}
          </p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Open BNPL Balance</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {formatCurrency(openBnplBalance, currency)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">{bnplAccountCount} active accounts</p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Inventory Health</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{inventoryHealth}%</p>
          <p className="mt-1 text-xs text-neutral-400">
            {lowStockProducts.length} low stock, {outOfStockProducts.length} out of stock
          </p>
        </article>
      </div>

      <article className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">Sales Trend (Last 7 Days)</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-500">
              Total <strong className="text-neutral-800">{formatCurrency(total7d, currency)}</strong>
            </span>
            <span className="text-neutral-500">
              Avg/day <strong className="text-neutral-800">{formatCurrency(avgDaily7d, currency)}</strong>
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {dailySales7d.map((day) => {
            const ratio = maxDailySales > 0 ? (day.total / maxDailySales) * 100 : 0;
            return (
              <div key={day.key} className="rounded-lg border border-neutral-100 bg-neutral-50 p-2">
                <p className="text-center text-[11px] font-medium text-neutral-500">{day.label}</p>
                <div className="mt-2 h-16 rounded-md bg-white p-1">
                  <div className="flex h-full items-end justify-center">
                    <div
                      className="w-full rounded-sm bg-brand-600"
                      style={{ height: `${Math.max(8, ratio)}%` }}
                      title={`${day.fullLabel}: ${formatCurrency(day.total, currency)}`}
                    />
                  </div>
                </div>
                <p className="mt-2 truncate text-center text-[10px] text-neutral-600">
                  {formatCurrency(day.total, currency)}
                </p>
              </div>
            );
          })}
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <article className="rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-800">Recent Orders</h2>
            <Link href={`${basePath}/orders`} className="text-xs font-medium text-brand-700 hover:text-brand-800">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-neutral-400">
              No orders yet. Start from the POS terminal.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-mono text-xs text-neutral-500">#{order.id.slice(0, 8)}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(Number(order.total), currency)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className="text-[11px] text-neutral-500">
                        {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                          ORDER_STATUS_CLASSES[order.status] ?? "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="space-y-6">
          <article className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-800">Payment Mix Today</h2>

            {paymentEntries.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-400">No payment data yet for today.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {paymentEntries.map(([method, total]) => {
                  const ratio = todaySales > 0 ? (total / todaySales) * 100 : 0;
                  return (
                    <li key={method}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-600">
                          {PAYMENT_LABELS[method] ?? method}
                        </span>
                        <span className="text-neutral-500">{ratio.toFixed(0)}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-brand-600"
                          style={{ width: `${Math.max(4, ratio)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-800">Operations Snapshot</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Active products</dt>
                <dd className="font-semibold text-neutral-900">{activeProducts.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Low stock alerts</dt>
                <dd className="font-semibold text-warning-700">{lowStockProducts.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Team members</dt>
                <dd className="font-semibold text-neutral-900">{storeMembers.length}</dd>
              </div>
            </dl>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <Link
                href={`${basePath}/pos`}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-center font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Open POS
              </Link>
              <Link
                href={`${basePath}/inventory`}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-center font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Manage Stock
              </Link>
              <Link
                href={`${basePath}/bnpl`}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-center font-medium text-neutral-700 hover:bg-neutral-50"
              >
                BNPL Accounts
              </Link>
              <Link
                href={`${basePath}/reports`}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-center font-medium text-neutral-700 hover:bg-neutral-50"
              >
                View Reports
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
