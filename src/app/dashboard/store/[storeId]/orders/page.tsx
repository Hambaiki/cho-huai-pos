import Link from "next/link";
import { redirect } from "next/navigation";
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

export const metadata = { title: "Orders" };

const STATUS_CLASSES: Record<string, string> = {
  completed: "bg-success-100 text-success-700",
  voided: "bg-neutral-100 text-neutral-500",
  refunded: "bg-warning-100 text-warning-700",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  qr_transfer: "QR Transfer",
  card: "Card",
  split: "Split",
  bnpl: "BNPL",
};

export default async function OrdersPage({
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

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, payment_method, status, created_at, cashier_id")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);

  const basePath = `/dashboard/store/${storeId}`;

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" description="Recent transaction history" />

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!orders || orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-neutral-400"
                >
                  No orders yet. Start selling from the POS terminal.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-neutral-500">
                    {order.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-neutral-700">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-neutral-600">
                    {METHOD_LABELS[order.payment_method] ??
                      order.payment_method}
                  </TableCell>
                  <TableCell className="text-right font-medium text-neutral-900">
                    {formatCurrency(Number(order.total), currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_CLASSES[order.status] ??
                        "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`${basePath}/orders/${order.id}`}
                      className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}
