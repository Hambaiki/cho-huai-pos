import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/auth";
import { getOrderDetailData } from "@/lib/queries/orders";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PageHeader } from "@/components/ui/PageHeader";
import VoidOrderButton from "@/components/orders/VoidOrderButton";

export const metadata = { title: "Order Detail" };

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  qr_transfer: "QR Transfer",
  card: "Card",
  split: "Split",
  bnpl: "BNPL",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; storeId: string }>;
}) {
  const { id: orderId, storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getOrderDetailData({
    userId: user.id,
    storeId,
    orderId,
  });

  if (!data) redirect("/dashboard");
  if (!data.order) notFound();

  const { currency, isManager, order } = data;
  const canVoid = order.status === "completed" && isManager;

  type QrChannelRel = { label: string } | null;
  const qrChannel = order.qr_channels as unknown as QrChannelRel;
  const voidedAt = order.voided_at;
  const voidReason = order.void_reason;

  const backHref = `/dashboard/store/${storeId}/orders`;

  return (
    <section className="space-y-6">
      <PageHeader
        title={`${order.id} — ${METHOD_LABELS[order.payment_method] ?? order.payment_method}`}
        description={new Date(order.created_at).toLocaleString()}
        backHref={backHref}
        backLabel="Back to Orders"
        actions={canVoid ? <VoidOrderButton orderId={order.id} /> : null}
      />

      {order.status === "voided" && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
          <p className="text-sm font-medium text-danger-700">
            Order voided
            {voidedAt ? ` on ${new Date(voidedAt).toLocaleString()}` : ""}
          </p>
          {voidReason && (
            <p className="text-xs text-danger-600 mt-1">Reason: {voidReason}</p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">Items</h2>
        </div>
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-2">Product</TableHead>
              <TableHead className="py-2 text-right">Qty</TableHead>
              <TableHead className="py-2 text-right">Unit Price</TableHead>
              <TableHead className="py-2 text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(
              order.order_items as unknown as Array<{
                product_name: string;
                quantity: number;
                unit_price: number;
                discount: number;
                subtotal: number;
              }>
            ).map((item, i) => (
              <TableRow key={i} className="border-t border-neutral-100">
                <TableCell className="py-3 text-neutral-800">
                  {item.product_name}
                </TableCell>
                <TableCell className="py-3 text-right text-neutral-600">
                  {item.quantity}
                </TableCell>
                <TableCell className="py-3 text-right text-neutral-600">
                  {formatCurrency(Number(item.unit_price), currency)}
                </TableCell>
                <TableCell className="py-3 text-right text-neutral-800 font-medium">
                  {formatCurrency(Number(item.subtotal), currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{formatCurrency(Number(order.subtotal), currency)}</span>
        </div>
        {Number(order.discount) > 0 && (
          <div className="flex justify-between text-danger-600">
            <span>Discount</span>
            <span>−{formatCurrency(Number(order.discount), currency)}</span>
          </div>
        )}
        {Number(order.tax_amount) > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Tax</span>
            <span>{formatCurrency(Number(order.tax_amount), currency)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-neutral-900 border-t border-neutral-100 pt-2 text-base">
          <span>Total</span>
          <span>{formatCurrency(Number(order.total), currency)}</span>
        </div>
        <div className="pt-2 space-y-1">
          <div className="flex justify-between text-neutral-500">
            <span>Payment method</span>
            <span className="capitalize">
              {METHOD_LABELS[order.payment_method] ?? order.payment_method}
              {qrChannel && ` — ${qrChannel.label}`}
              {order.qr_reference && ` (ref: ${order.qr_reference})`}
            </span>
          </div>
          {order.amount_tendered != null && (
            <div className="flex justify-between text-neutral-500">
              <span>Amount tendered</span>
              <span>
                {formatCurrency(Number(order.amount_tendered), currency)}
              </span>
            </div>
          )}
          {Number(order.change_amount) > 0 && (
            <div className="flex justify-between text-neutral-500">
              <span>Change</span>
              <span>
                {formatCurrency(Number(order.change_amount), currency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
