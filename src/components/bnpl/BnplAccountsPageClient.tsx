"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BnplAccountCreateModal } from "@/components/bnpl/BnplAccountCreateModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
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
import type { BnplAccountSummary } from "@/lib/types/bnpl";

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-success-100 text-success-700",
  frozen: "bg-warning-100 text-warning-700",
  closed: "bg-neutral-100 text-neutral-500",
  settled: "bg-info-100 text-info-700",
};

interface BnplAccountsPageClientProps {
  accounts: BnplAccountSummary[];
  currency: CurrencyStore;
  isManager: boolean;
  storeId: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  initialQuery: string;
  initialStatuses: string[];
  initialBalanceStatuses: string[];
}

export function BnplAccountsPageClient({
  accounts,
  currency,
  isManager,
  storeId,
  currentPage,
  totalItems,
  pageSize,
  initialQuery,
  initialStatuses,
  initialBalanceStatuses,
}: BnplAccountsPageClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Frozen", value: "frozen" },
    { label: "Closed", value: "closed" },
    { label: "Settled", value: "settled" },
  ];

  const balanceStatusOptions = [
    { label: "Has Balance Due", value: "has_balance" },
    { label: "No Balance", value: "no_balance" },
  ];

  const hasFilters =
    initialQuery.length > 0 ||
    initialStatuses.length > 0 ||
    initialBalanceStatuses.length > 0;

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
      <PageHeader
        title="BNPL Accounts"
        description="Buy-now-pay-later credit accounts"
        actions={
          isManager ? (
            <Button
              onClick={() => setIsCreateOpen(true)}
            >
              + New Account
            </Button>
          ) : null
        }
      />

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search by customer name or phone..."
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
          label="Balance"
          options={balanceStatusOptions}
          selected={initialBalanceStatuses}
          onSelect={(selected) =>
            updateParams({
              balanceStatuses: selected.length > 0 ? selected.join(",") : null,
              page: null,
            })
          }
        />
      </div>

      {hasFilters && (
        <div className="text-xs text-neutral-500">
          Found {totalItems} matching account{totalItems === 1 ? "" : "s"}
        </div>
      )}

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-neutral-400">
                  {hasFilters
                    ? "No BNPL accounts match your filters."
                    : "No BNPL accounts yet."}
                  {" "}
                  {isManager && totalItems === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      Create the first account
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-neutral-900">
                    {account.customer_name}
                  </TableCell>
                  <TableCell className="text-neutral-500">{account.phone ?? "—"}</TableCell>
                  <TableCell className="text-right text-neutral-700">
                    {formatCurrency(Number(account.credit_limit), currency)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-danger-700">
                    {formatCurrency(Number(account.balance_due), currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_CLASSES[account.status] ?? "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {account.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/store/${storeId}/bnpl/${account.id}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-800"
                    >
                      View
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

      {isManager ? (
        <BnplAccountCreateModal
          open={isCreateOpen}
          storeId={storeId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => router.refresh()}
        />
      ) : null}
    </section>
  );
}