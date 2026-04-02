import type { Tables } from "@/lib/supabase/types";

export type PeriodFinancials = {
  cost: number;
  knownRevenue: number;
  profit: number;
  missingCostRevenue: number;
  missingCostUnits: number;
  coveragePct: number;
  marginPct: number;
};

export type ReportOrder = Pick<
  Tables<"orders">,
  "total" | "discount" | "payment_method" | "created_at"
>;

export type ReportOrderItem = Pick<
  Tables<"order_items">,
  "product_name" | "quantity" | "subtotal" | "unit_cost"
> & { orders: { created_at: string } };

export type OverdueInstallment = Pick<
  Tables<"bnpl_installments">,
  "id" | "amount" | "due_date" | "account_id"
> & { bnpl_accounts: { customer_name: string } };

export type ReportPromotionRedemption = Pick<
  Tables<"promotion_redemptions">,
  "discount_amount"
> & {
  orders: { created_at: string };
  store_promotions: { applies_automatically: boolean };
};

export function formatDelta(delta: number): string {
  if (delta === 0) return "0%";
  const abs = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
}

export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function isWithinRange(
  value: string,
  start: Date,
  endInclusive?: Date,
): boolean {
  const time = new Date(value).getTime();
  if (time < start.getTime()) return false;
  if (endInclusive && time > endInclusive.getTime()) return false;
  return true;
}

export function summarizeFinancials(
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
