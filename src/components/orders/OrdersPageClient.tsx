"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, BadgeCheck, CreditCard, ReceiptText, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";

interface Order {
  id: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  cashier_id: string | null;
}

interface OrdersPageClientProps {
  orders: Order[];
  currency: CurrencyStore;
  storeId: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  initialQuery: string;
  initialStatuses: string[];
  initialMethods: string[];
}

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

const STATUS_ICONS = {
  completed: BadgeCheck,
  refunded: Undo2,
} as const;

const METHOD_ICONS = {
  cash: ReceiptText,
  qr_transfer: CreditCard,
  card: CreditCard,
  split: CreditCard,
  bnpl: CreditCard,
} as const;

export function OrdersPageClient({
  orders,
  currency,
  storeId,
  currentPage,
  totalItems,
  pageSize,
  initialQuery,
  initialStatuses,
  initialMethods,
}: OrdersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const basePath = `/dashboard/store/${storeId}`;

  const statusOptions = [
    { label: "Completed", value: "completed" },
    { label: "Voided", value: "voided" },
    { label: "Refunded", value: "refunded" },
  ];

  const methodOptions = [
    { label: "Cash", value: "cash" },
    { label: "QR Transfer", value: "qr_transfer" },
    { label: "Card", value: "card" },
    { label: "Split", value: "split" },
    { label: "BNPL", value: "bnpl" },
  ];

  const hasFilters =
    initialQuery.length > 0 ||
    initialStatuses.length > 0 ||
    initialMethods.length > 0;

  const updateParams = useMemo(
    () => (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" description="Recent transaction history" />

      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search by order ID or total..."
          initialValue={initialQuery}
          onSearch={(value) =>
            updateParams({
              query: value.trim() || null,
              page: null,
            })
          }
        />
        <FilterSelect
          label="Status"
          options={statusOptions}
          selected={initialStatuses}
          onSelect={(selected) =>
            updateParams({
              statuses: selected.length > 0 ? selected.join(",") : null,
              page: null,
            })
          }
        />
        <FilterSelect
          label="Payment Method"
          options={methodOptions}
          selected={initialMethods}
          onSelect={(selected) =>
            updateParams({
              methods: selected.length > 0 ? selected.join(",") : null,
              page: null,
            })
          }
        />
      </div>

      {hasFilters && (
        <div className="text-xs text-neutral-500">
          Found {totalItems} matching order{totalItems === 1 ? "" : "s"}
        </div>
      )}

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
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-neutral-400"
                >
                  {hasFilters
                    ? "No orders match your filters."
                    : "No orders yet. Start selling from the POS terminal."}
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
                    <span className="inline-flex items-center gap-1.5">
                      {(() => {
                        const MethodIcon =
                          METHOD_ICONS[
                            order.payment_method as keyof typeof METHOD_ICONS
                          ];
                        return MethodIcon ? <MethodIcon size={14} /> : null;
                      })()}
                      <span>
                        {METHOD_LABELS[order.payment_method] ??
                          order.payment_method}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-neutral-900">
                    {formatCurrency(Number(order.total), currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_CLASSES[order.status] ??
                        "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {(() => {
                        const StatusIcon =
                          STATUS_ICONS[
                            order.status as keyof typeof STATUS_ICONS
                          ];
                        return StatusIcon ? <StatusIcon size={12} /> : null;
                      })()}
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`${basePath}/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800"
                    >
                      View
                      <ArrowUpRight size={13} />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={(page) => updateParams({ page: String(page) })}
        />
      </TableContainer>
    </section>
  );
}
