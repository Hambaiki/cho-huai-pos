"use client";

import Link from "next/link";
import { useState } from "react";
import { BnplAccountCreateModal } from "@/components/bnpl/BnplAccountCreateModal";
import { PageHeader } from "@/components/ui/PageHeader";
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
}

export function BnplAccountsPageClient({
  accounts: initialAccounts,
  currency,
  isManager,
  storeId,
}: BnplAccountsPageClientProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <section className="space-y-6">
      <PageHeader
        title="BNPL Accounts"
        description="Buy-now-pay-later credit accounts"
        actions={
          isManager ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              + New Account
            </button>
          ) : null
        }
      />

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
                  No BNPL accounts yet.{" "}
                  {isManager ? (
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(true)}
                      className="text-brand-600 hover:underline"
                    >
                      Create the first account
                    </button>
                  ) : null}
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
      </TableContainer>

      {isManager ? (
        <BnplAccountCreateModal
          open={isCreateOpen}
          storeId={storeId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(account) => setAccounts((prev) => [account, ...prev])}
        />
      ) : null}
    </section>
  );
}