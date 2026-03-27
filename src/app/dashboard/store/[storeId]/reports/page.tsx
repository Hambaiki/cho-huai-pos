import { redirect } from "next/navigation";
import {
  BadgeDollarSign,
  CalendarRange,
  CreditCard,
  HandCoins,
  Receipt,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export const metadata = { title: "Reports" };

type ReportOrder = {
  total: number;
  payment_method: string;
  created_at: string;
};

type ReportOrderItem = {
  product_name: string;
  quantity: number;
  subtotal: number;
  unit_cost: number | null;
  orders: {
    created_at: string;
  };
};

type PeriodFinancials = {
  cost: number;
  knownRevenue: number;
  profit: number;
  missingCostRevenue: number;
  missingCostUnits: number;
  coveragePct: number;
  marginPct: number;
};

function formatDelta(delta: number): string {
  if (delta === 0) return "0%";
  const abs = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
}

function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function isWithinRange(
  value: string,
  start: Date,
  endInclusive?: Date,
): boolean {
  const time = new Date(value).getTime();
  if (time < start.getTime()) return false;
  if (endInclusive && time > endInclusive.getTime()) return false;
  return true;
}

function summarizeFinancials(
  items: ReportOrderItem[],
  revenue: number,
): PeriodFinancials {
  let cost = 0;
  let knownRevenue = 0;
  let profit = 0;
  let missingCostRevenue = 0;
  let missingCostUnits = 0;

  items.forEach((item) => {
    const subtotal = Number(item.subtotal);
    const quantity = Number(item.quantity);
    const unitCost = item.unit_cost == null ? null : Number(item.unit_cost);

    if (unitCost == null) {
      missingCostRevenue += subtotal;
      missingCostUnits += quantity;
      return;
    }

    const itemCost = unitCost * quantity;
    knownRevenue += subtotal;
    cost += itemCost;
    profit += subtotal - itemCost;
  });

  return {
    cost,
    knownRevenue,
    profit,
    missingCostRevenue,
    missingCostUnits,
    coveragePct: revenue > 0 ? (knownRevenue / revenue) * 100 : 100,
    marginPct: knownRevenue > 0 ? (profit / knownRevenue) * 100 : 0,
  };
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
    { data: completedOrders },
    { data: completedOrderItems },
    { data: bnplSummary },
    { data: overdueInstallments },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, payment_method, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", startOfPrev30Days.toISOString()),

    supabase
      .from("order_items")
      .select(
        "product_name, quantity, subtotal, unit_cost, orders!inner(store_id, status, created_at)",
      )
      .eq("orders.store_id", storeId)
      .eq("orders.status", "completed")
      .gte("orders.created_at", startOfPrev30Days.toISOString()),

    supabase
      .from("bnpl_accounts")
      .select("status, balance_due, credit_limit")
      .eq("store_id", storeId),

    supabase
      .from("bnpl_installments")
      .select(
        "id, amount, due_date, account_id, bnpl_accounts!inner(store_id, customer_name)",
      )
      .eq("bnpl_accounts.store_id", storeId)
      .eq("status", "pending")
      .lt("due_date", now.toISOString().slice(0, 10)),
  ]);

  const orderList = (completedOrders ?? []) as ReportOrder[];
  const orderItems = (completedOrderItems ?? []) as unknown as ReportOrderItem[];

  const ordersToday = orderList.filter((order) =>
    isWithinRange(order.created_at, startOfToday),
  );
  const orders7d = orderList.filter((order) =>
    isWithinRange(order.created_at, startOf7Days),
  );
  const ordersPrev7d = orderList.filter((order) =>
    isWithinRange(order.created_at, startOfPrev7Days, endOfPrev7Days),
  );
  const orders30d = orderList.filter((order) =>
    isWithinRange(order.created_at, startOf30Days),
  );
  const ordersPrev30d = orderList.filter((order) =>
    isWithinRange(order.created_at, startOfPrev30Days, endOfPrev30Days),
  );

  const itemsToday = orderItems.filter((item) =>
    isWithinRange(item.orders.created_at, startOfToday),
  );
  const items7d = orderItems.filter((item) =>
    isWithinRange(item.orders.created_at, startOf7Days),
  );
  const itemsPrev7d = orderItems.filter((item) =>
    isWithinRange(item.orders.created_at, startOfPrev7Days, endOfPrev7Days),
  );
  const items30d = orderItems.filter((item) =>
    isWithinRange(item.orders.created_at, startOf30Days),
  );
  const itemsPrev30d = orderItems.filter((item) =>
    isWithinRange(item.orders.created_at, startOfPrev30Days, endOfPrev30Days),
  );

  const todayRevenue = ordersToday.reduce((sum, order) => sum + Number(order.total), 0);
  const total7d = orders7d.reduce((sum, order) => sum + Number(order.total), 0);
  const prev7dRevenue = ordersPrev7d.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const total30d = orders30d.reduce((sum, order) => sum + Number(order.total), 0);
  const prev30dRevenue = ordersPrev30d.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const ordersTodayCount = ordersToday.length;

  const todayFinancials = summarizeFinancials(itemsToday, todayRevenue);
  const financials7d = summarizeFinancials(items7d, total7d);
  const financialsPrev7d = summarizeFinancials(itemsPrev7d, prev7dRevenue);
  const financials30d = summarizeFinancials(items30d, total30d);
  const financialsPrev30d = summarizeFinancials(itemsPrev30d, prev30dRevenue);

  const delta7dPct = calculateDelta(total7d, prev7dRevenue);
  const delta7dProfitPct = calculateDelta(
    financials7d.profit,
    financialsPrev7d.profit,
  );
  const delta30dProfitPct = calculateDelta(
    financials30d.profit,
    financialsPrev30d.profit,
  );

  // Daily breakdown for visual trend + table (last 7 days)
  const dailyFinancials: Record<
    string,
    { revenue: number; knownRevenue: number; cost: number; profit: number }
  > = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOf7Days);
    d.setDate(startOf7Days.getDate() + i);
    dailyFinancials[d.toLocaleDateString("en-CA")] = {
      revenue: 0,
      knownRevenue: 0,
      cost: 0,
      profit: 0,
    };
  }
  orders7d.forEach((o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-CA");
    if (day in dailyFinancials)
      dailyFinancials[day].revenue += Number(o.total);
  });

  items7d.forEach((item) => {
    const day = new Date(item.orders.created_at).toLocaleDateString("en-CA");
    if (!(day in dailyFinancials) || item.unit_cost == null) return;

    const subtotal = Number(item.subtotal);
    const itemCost = Number(item.unit_cost) * Number(item.quantity);
    dailyFinancials[day].knownRevenue += subtotal;
    dailyFinancials[day].cost += itemCost;
    dailyFinancials[day].profit += subtotal - itemCost;
  });

  const dailySalesEntries = Object.entries(dailyFinancials).map(
    ([date, stats]) => ({
      date,
      revenue: stats.revenue,
      cost: stats.cost,
      profit: stats.profit,
      coveragePct: stats.revenue > 0 ? (stats.knownRevenue / stats.revenue) * 100 : 100,
    }),
  );
  const maxDailySales = dailySalesEntries.reduce(
    (max, day) => Math.max(max, day.revenue),
    0,
  );
  const bestDay = [...dailySalesEntries].sort((a, b) => b.revenue - a.revenue)[0];
  const weakestDay = [...dailySalesEntries].sort(
    (a, b) => a.revenue - b.revenue,
  )[0];

  // Payment method breakdown
  const methodTotals: Record<string, number> = {};
  orders30d.forEach((o) => {
    methodTotals[o.payment_method] =
      (methodTotals[o.payment_method] ?? 0) + Number(o.total);
  });
  const paymentMethodEntries = Object.entries(methodTotals).sort(
    (a, b) => b[1] - a[1],
  );

  // Top products
  const productTotals: Record<
    string,
    {
      qty: number;
      revenue: number;
      knownRevenue: number;
      cost: number;
      profit: number;
    }
  > = {};
  items30d.forEach((item) => {
    if (!productTotals[item.product_name])
      productTotals[item.product_name] = {
        qty: 0,
        revenue: 0,
        knownRevenue: 0,
        cost: 0,
        profit: 0,
      };

    const product = productTotals[item.product_name];
    const subtotal = Number(item.subtotal);
    product.qty += Number(item.quantity);
    product.revenue += subtotal;

    if (item.unit_cost == null) return;

    const itemCost = Number(item.unit_cost) * Number(item.quantity);
    product.knownRevenue += subtotal;
    product.cost += itemCost;
    product.profit += subtotal - itemCost;
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
  const missingCostSales30d = Math.max(
    0,
    total30d - financials30d.knownRevenue,
  );

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
        description="Historical analytics and financial overview"
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-neutral-200 px-3 py-2 text-neutral-700">
              7-day revenue: {formatDelta(delta7dPct)}
            </span>
            <span className="rounded-full bg-neutral-200 px-3 py-2 text-neutral-700">
              7-day profit: {formatDelta(delta7dProfitPct)}
            </span>
            <span className="rounded-full bg-neutral-200 px-3 py-2 text-neutral-700">
              30-day profit: {formatDelta(delta30dProfitPct)}
            </span>
          </div>
        }
      />

      {/* KPI row */}
      <div id="summary" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {[
          {
            label: "Today's Revenue",
            value: formatCurrency(todayRevenue, currency),
            sub: `${ordersTodayCount} transactions`,
            icon: Wallet,
          },
          {
            label: "Today's Gross Profit",
            value: formatCurrency(todayFinancials.profit, currency),
            sub: `Coverage ${todayFinancials.coveragePct.toFixed(0)}%`,
            icon: BadgeDollarSign,
          },
          {
            label: "Last 7 Days Revenue",
            value: formatCurrency(total7d, currency),
            sub: `Avg/day ${formatCurrency(avgDaily7d, currency)}`,
            icon: CalendarRange,
          },
          {
            label: "Last 7 Days Gross Profit",
            value: formatCurrency(financials7d.profit, currency),
            sub: `Margin ${financials7d.marginPct.toFixed(1)}%`,
            icon: Receipt,
          },
          {
            label: "Last 30 Days Revenue",
            value: formatCurrency(total30d, currency),
            sub: `Avg/day ${formatCurrency(avgDaily30d, currency)}`,
            icon: CalendarRange,
          },
          {
            label: "Last 30 Days Gross Profit",
            value: formatCurrency(financials30d.profit, currency),
            sub: `Coverage ${financials30d.coveragePct.toFixed(0)}%`,
            icon: HandCoins,
          },
          {
            label: "BNPL Receivable",
            value: formatCurrency(totalBnplBalance, currency),
            sub: `${activeBnpl.length} active accounts`,
            icon: CreditCard,
          },
          {
            label: "Overdue BNPL",
            value: formatCurrency(overdueTotal, currency),
            sub: `${overdueList.length} installments`,
            danger: overdueList.length > 0,
            icon: TriangleAlert,
          },
        ].map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            subLabel={card.sub}
            icon={card.icon}
            tone={card.danger ? "danger" : "default"}
          />
        ))}
      </div>

      {missingCostSales30d > 0 ? (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
          Gross profit is calculated only from items with recorded cost prices. Last 30 days currently have
          {" "}
          {formatCurrency(missingCostSales30d, currency)}
          {" "}
          in revenue without cost coverage.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div id="sales-trend-7d" className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800">
              Revenue Trend — Last 7 Days
            </h2>
            <span className="text-xs text-neutral-500">
              Compared to previous 7 days: {formatDelta(delta7dPct)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {dailySalesEntries.map(({ date, revenue }) => {
              const ratio =
                maxDailySales > 0 ? (revenue / maxDailySales) * 100 : 0;
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
                        className="w-full rounded-sm bg-brand-500"
                        style={{ height: `${Math.max(8, ratio)}%` }}
                        title={`${displayDate.toLocaleDateString()}: ${formatCurrency(revenue, currency)}`}
                      />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-center text-[10px] text-neutral-600">
                    {formatCurrency(revenue, currency)}
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
                    )} — ${formatCurrency(bestDay.revenue, currency)}`
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
                    })} — ${formatCurrency(weakestDay.revenue, currency)}`
                  : "No data"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div id="financial-overview-30d" className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold text-neutral-800">
              Financial Overview — Last 30 Days
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">Revenue</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(total30d, currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">COGS</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(financials30d.cost, currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">Gross Profit</dt>
                <dd className="font-medium text-success-700">
                  {formatCurrency(financials30d.profit, currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">Gross Margin</dt>
                <dd className="font-medium text-neutral-900">
                  {financials30d.marginPct.toFixed(1)}%
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">Cost Coverage</dt>
                <dd className="font-medium text-neutral-900">
                  {financials30d.coveragePct.toFixed(0)}%
                </dd>
              </div>
            </dl>
          </div>

          <div id="payment-mix-30d" className="rounded-xl border border-neutral-200 bg-white p-5">
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
                          className="h-full rounded-full bg-brand-500"
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
        <TableContainer className="rounded-none border-0 bg-transparent">
          <Table className="min-w-190">
            <TableHeader className="text-xs text-neutral-500 uppercase">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2">Date</TableHead>
                <TableHead className="py-2 text-right">Revenue</TableHead>
                <TableHead className="py-2 text-right">COGS</TableHead>
                <TableHead className="py-2 text-right">Gross Profit</TableHead>
                <TableHead className="py-2 text-right">Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySalesEntries.map(({ date, revenue, cost, profit, coveragePct }) => (
                <TableRow key={date} className="border-t border-neutral-100">
                  <TableCell className="py-3 text-neutral-700">
                    {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="py-3 text-right font-medium text-neutral-900">
                    {formatCurrency(revenue, currency)}
                  </TableCell>
                  <TableCell className="py-3 text-right text-neutral-600">
                    {formatCurrency(cost, currency)}
                  </TableCell>
                  <TableCell className="py-3 text-right font-medium text-success-700">
                    {formatCurrency(profit, currency)}
                  </TableCell>
                  <TableCell className="py-3 text-right text-neutral-600">
                    {coveragePct.toFixed(0)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Top products */}
      <div id="top-products-30d" className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">
            Top Products — Last 30 Days
          </h2>
        </div>
        <TableContainer className="rounded-none border-0 bg-transparent">
          <Table className="min-w-190">
            <TableHeader className="text-xs text-neutral-500 uppercase">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2">Product</TableHead>
                <TableHead className="py-2 text-right">Qty Sold</TableHead>
                <TableHead className="py-2 text-right">Revenue</TableHead>
                <TableHead className="py-2 text-right">COGS</TableHead>
                <TableHead className="py-2 text-right">Gross Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProductList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-neutral-400"
                  >
                    No sales data
                  </TableCell>
                </TableRow>
              ) : (
                topProductList.map(([name, stats]) => (
                  <TableRow key={name} className="border-t border-neutral-100">
                    <TableCell className="py-3 text-neutral-800 font-medium">
                      {name}
                    </TableCell>
                    <TableCell className="py-3 text-right text-neutral-600">
                      {stats.qty}
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium text-neutral-900">
                      {formatCurrency(stats.revenue, currency)}
                    </TableCell>
                    <TableCell className="py-3 text-right text-neutral-600">
                      {formatCurrency(stats.cost, currency)}
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium text-success-700">
                      {formatCurrency(stats.profit, currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Overdue BNPL installments */}
      {overdueList.length > 0 && (
        <div id="bnpl-overdue" className="rounded-lg border border-danger-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-danger-100">
            <h2 className="font-semibold text-danger-800">
              Overdue Installments
            </h2>
          </div>
          <TableContainer className="rounded-none border-0 bg-transparent">
            <Table className="min-w-140">
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
                    <TableCell className="py-3 text-neutral-800 font-medium">
                      {inst.bnpl_accounts.customer_name}
                    </TableCell>
                    <TableCell className="py-3 text-danger-600">
                      {new Date(inst.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium text-danger-700">
                      {formatCurrency(Number(inst.amount), currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </section>
  );
}
