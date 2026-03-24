import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Reports" };

function formatDelta(delta: number): string {
  if (delta === 0) return "0%";
  const abs = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
}

export default async function ReportsPage({
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
      "store_id, stores(currency_code, currency_symbol, currency_decimals, symbol_position)",
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

  // Date ranges
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOf7Days = new Date(now);
  startOf7Days.setDate(now.getDate() - 6);
  startOf7Days.setHours(0, 0, 0, 0);
  const startOfPrev7Days = new Date(startOf7Days);
  startOfPrev7Days.setDate(startOf7Days.getDate() - 7);
  const endOfPrev7Days = new Date(startOf7Days.getTime() - 1);
  const startOf30Days = new Date(now);
  startOf30Days.setDate(now.getDate() - 29);
  startOf30Days.setHours(0, 0, 0, 0);
  const startOfPrev30Days = new Date(startOf30Days);
  startOfPrev30Days.setDate(startOf30Days.getDate() - 30);
  const endOfPrev30Days = new Date(startOf30Days.getTime() - 1);

  const [
    { data: ordersToday },
    { data: orders7d },
    { data: ordersPrev7d },
    { data: orders30d },
    { data: ordersPrev30d },
    { data: topProducts },
    { data: paymentBreakdown },
    { data: bnplSummary },
    { data: overdueInstallments },
  ] = await Promise.all([
    // Today
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOfToday.toISOString()),

    // Last 7 days
    supabase
      .from("orders")
      .select("total, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOf7Days.toISOString()),

    // Previous 7 days
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOfPrev7Days.toISOString())
      .lte("created_at", endOfPrev7Days.toISOString()),

    // Last 30 days
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOf30Days.toISOString()),

    // Previous 30 days
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOfPrev30Days.toISOString())
      .lte("created_at", endOfPrev30Days.toISOString()),

    // Top products by quantity sold (last 30 days)
    supabase
      .from("order_items")
      .select(
        "product_name, quantity, subtotal, orders!inner(store_id, status, created_at)",
      )
      .eq("orders.store_id", storeId)
      .eq("orders.status", "completed")
      .gte("orders.created_at", startOf30Days.toISOString()),

    // Payment method breakdown (last 30 days)
    supabase
      .from("orders")
      .select("payment_method, total")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOf30Days.toISOString()),

    // BNPL summary
    supabase
      .from("bnpl_accounts")
      .select("status, balance_due, credit_limit")
      .eq("store_id", storeId),

    // Overdue installments
    supabase
      .from("bnpl_installments")
      .select(
        "id, amount, due_date, account_id, bnpl_accounts!inner(store_id, customer_name)",
      )
      .eq("bnpl_accounts.store_id", storeId)
      .eq("status", "pending")
      .lt("due_date", now.toISOString().slice(0, 10)),
  ]);

  // Compute KPIs
  const todaySales = (ordersToday ?? []).reduce(
    (s, o) => s + Number(o.total),
    0,
  );
  const total7d = (orders7d ?? []).reduce((s, o) => s + Number(o.total), 0);
  const prev7dTotal = (ordersPrev7d ?? []).reduce(
    (s, o) => s + Number(o.total),
    0,
  );
  const total30d = (orders30d ?? []).reduce((s, o) => s + Number(o.total), 0);
  const prev30dTotal = (ordersPrev30d ?? []).reduce(
    (s, o) => s + Number(o.total),
    0,
  );
  const ordersTodayCount = ordersToday?.length ?? 0;

  const delta7dPct =
    prev7dTotal === 0
      ? total7d > 0
        ? 100
        : 0
      : ((total7d - prev7dTotal) / prev7dTotal) * 100;
  const delta30dPct =
    prev30dTotal === 0
      ? total30d > 0
        ? 100
        : 0
      : ((total30d - prev30dTotal) / prev30dTotal) * 100;

  // Daily breakdown for visual trend + table (last 7 days)
  const dailySales: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOf7Days);
    d.setDate(startOf7Days.getDate() + i);
    dailySales[d.toLocaleDateString("en-CA")] = 0;
  }
  (orders7d ?? []).forEach((o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-CA");
    if (day in dailySales)
      dailySales[day] = (dailySales[day] ?? 0) + Number(o.total);
  });

  const dailySalesEntries = Object.entries(dailySales).map(([date, total]) => ({
    date,
    total,
  }));
  const maxDailySales = dailySalesEntries.reduce(
    (max, day) => Math.max(max, day.total),
    0,
  );
  const bestDay = [...dailySalesEntries].sort((a, b) => b.total - a.total)[0];
  const weakestDay = [...dailySalesEntries].sort(
    (a, b) => a.total - b.total,
  )[0];

  // Payment method breakdown
  const methodTotals: Record<string, number> = {};
  (paymentBreakdown ?? []).forEach((o) => {
    methodTotals[o.payment_method] =
      (methodTotals[o.payment_method] ?? 0) + Number(o.total);
  });
  const paymentMethodEntries = Object.entries(methodTotals).sort(
    (a, b) => b[1] - a[1],
  );

  // Top products
  const productTotals: Record<string, { qty: number; revenue: number }> = {};
  (topProducts ?? []).forEach((item) => {
    if (!productTotals[item.product_name])
      productTotals[item.product_name] = { qty: 0, revenue: 0 };
    productTotals[item.product_name].qty += item.quantity;
    productTotals[item.product_name].revenue += Number(item.subtotal);
  });
  const topProductList = Object.entries(productTotals)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  // BNPL
  const activeBnpl = (bnplSummary ?? []).filter((a) => a.status === "active");
  const totalBnplBalance = activeBnpl.reduce(
    (s, a) => s + Number(a.balance_due),
    0,
  );
  type OverdueItem = {
    id: string;
    amount: number;
    due_date: string;
    account_id: string;
    bnpl_accounts: { customer_name: string };
  };
  const overdueList = (overdueInstallments ?? []) as unknown as OverdueItem[];
  const overdueTotal = overdueList.reduce((s, i) => s + Number(i.amount), 0);
  const avgDaily30d = total30d / 30;
  const avgDaily7d = total7d / 7;

  const METHOD_LABELS: Record<string, string> = {
    cash: "Cash",
    qr_transfer: "QR Transfer",
    card: "Card",
    split: "Split",
    bnpl: "BNPL",
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Reports"
        description="Sales analytics and financial overview"
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">
              7-day trend: {formatDelta(delta7dPct)}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">
              30-day trend: {formatDelta(delta30dPct)}
            </span>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {[
          {
            label: "Today's Sales",
            value: formatCurrency(todaySales, currency),
            sub: `${ordersTodayCount} transactions`,
          },
          {
            label: "Last 7 Days",
            value: formatCurrency(total7d, currency),
            sub: `Avg/day ${formatCurrency(avgDaily7d, currency)}`,
          },
          {
            label: "Last 30 Days",
            value: formatCurrency(total30d, currency),
            sub: `Avg/day ${formatCurrency(avgDaily30d, currency)}`,
          },
          {
            label: "BNPL Receivable",
            value: formatCurrency(totalBnplBalance, currency),
            sub: `${activeBnpl.length} active accounts`,
          },
          {
            label: "Overdue BNPL",
            value: formatCurrency(overdueTotal, currency),
            sub: `${overdueList.length} installments`,
            danger: overdueList.length > 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border bg-white px-5 py-4 ${card.danger ? "border-danger-200" : "border-neutral-200"}`}
          >
            <p className="text-xs font-semibold uppercase text-neutral-500">
              {card.label}
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${card.danger ? "text-danger-700" : "text-neutral-900"}`}
            >
              {card.value}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800">
              Revenue Trend — Last 7 Days
            </h2>
            <span className="text-xs text-neutral-500">
              Compared to previous 7 days: {formatDelta(delta7dPct)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {dailySalesEntries.map(({ date, total }) => {
              const ratio =
                maxDailySales > 0 ? (total / maxDailySales) * 100 : 0;
              const displayDate = new Date(`${date}T00:00:00`);
              return (
                <div
                  key={date}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 p-2"
                >
                  <p className="text-center text-[11px] font-medium text-neutral-500">
                    {displayDate.toLocaleDateString(undefined, {
                      weekday: "short",
                    })}
                  </p>
                  <div className="mt-2 h-20 rounded-md bg-white p-1">
                    <div className="flex h-full items-end justify-center">
                      <div
                        className="w-full rounded-sm bg-brand-600"
                        style={{ height: `${Math.max(8, ratio)}%` }}
                        title={`${displayDate.toLocaleDateString()}: ${formatCurrency(total, currency)}`}
                      />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-center text-[10px] text-neutral-600">
                    {formatCurrency(total, currency)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-success-700">
                Best day
              </p>
              <p className="mt-1 text-sm font-semibold text-success-800">
                {bestDay
                  ? `${new Date(`${bestDay.date}T00:00:00`).toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      },
                    )} — ${formatCurrency(bestDay.total, currency)}`
                  : "No data"}
              </p>
            </div>
            <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-warning-700">
                Weakest day
              </p>
              <p className="mt-1 text-sm font-semibold text-warning-800">
                {weakestDay
                  ? `${new Date(
                      `${weakestDay.date}T00:00:00`,
                    ).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })} — ${formatCurrency(weakestDay.total, currency)}`
                  : "No data"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold text-neutral-800">
              Payment Mix — Last 30 Days
            </h2>
            {paymentMethodEntries.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-400">No sales data</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {paymentMethodEntries.map(([method, total]) => {
                  const ratio = total30d > 0 ? (total / total30d) * 100 : 0;
                  return (
                    <li key={method}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-700">
                          {METHOD_LABELS[method] ?? method}
                        </span>
                        <span className="text-neutral-500">
                          {ratio.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-brand-600"
                          style={{ width: `${Math.max(4, ratio)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatCurrency(total, currency)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Daily sales last 7 days */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">
            Daily Sales — Last 7 Days
          </h2>
        </div>
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-2">Date</TableHead>
              <TableHead className="py-2 text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailySalesEntries.map(({ date, total }) => (
              <TableRow key={date} className="border-t border-neutral-100">
                <TableCell className="py-2.5 text-neutral-700">
                  {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell className="py-2.5 text-right font-medium text-neutral-900">
                  {formatCurrency(total, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Top products */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">
            Top Products — Last 30 Days
          </h2>
        </div>
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-2">Product</TableHead>
              <TableHead className="py-2 text-right">Qty Sold</TableHead>
              <TableHead className="py-2 text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProductList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-neutral-400"
                >
                  No sales data
                </TableCell>
              </TableRow>
            ) : (
              topProductList.map(([name, stats]) => (
                <TableRow key={name} className="border-t border-neutral-100">
                  <TableCell className="py-2.5 text-neutral-800 font-medium">
                    {name}
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-neutral-600">
                    {stats.qty}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-neutral-900">
                    {formatCurrency(stats.revenue, currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Overdue BNPL installments */}
      {overdueList.length > 0 && (
        <div className="rounded-lg border border-danger-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-danger-100">
            <h2 className="font-semibold text-danger-800">
              Overdue Installments
            </h2>
          </div>
          <Table>
            <TableHeader className="bg-danger-50 border-danger-100 text-xs text-danger-600 uppercase">
              <TableRow className="hover:bg-transparent border-danger-100">
                <TableHead className="py-2 text-danger-600">Customer</TableHead>
                <TableHead className="py-2 text-danger-600">Due Date</TableHead>
                <TableHead className="py-2 text-right text-danger-600">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueList.map((inst) => (
                <TableRow key={inst.id} className="border-t border-danger-100">
                  <TableCell className="py-2.5 text-neutral-800 font-medium">
                    {inst.bnpl_accounts.customer_name}
                  </TableCell>
                  <TableCell className="py-2.5 text-danger-600">
                    {new Date(inst.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-danger-700">
                    {formatCurrency(Number(inst.amount), currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
