"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import type { QrChannel } from "@/components/pos/QrPaymentScreen";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import RecordPaymentForm from "./RecordPaymentForm";
import RecordGeneralPaymentForm from "./RecordGeneralPaymentForm";

type Installment = {
  id: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "waived";
};

const PAGE_SIZE = 10;

export default function InstallmentList({
  installments,
  accountId,
  storeId,
  accountBalanceDue,
  currency,
  isManager,
  qrChannels,
}: {
  installments: Installment[];
  accountId: string;
  storeId: string;
  accountBalanceDue: number;
  currency: CurrencyStore;
  isManager: boolean;
  qrChannels: QrChannel[];
}) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [isGeneralPaymentOpen, setIsGeneralPaymentOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function isOverdue(inst: Installment) {
    return inst.status === "pending" && new Date(inst.due_date) < new Date();
  }

  const totalPages = Math.max(1, Math.ceil(installments.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedInstallments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return installments.slice(startIndex, startIndex + PAGE_SIZE);
  }, [installments, safeCurrentPage]);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h2 className="font-semibold text-neutral-800">Installments</h2>
        {isManager && accountBalanceDue > 0 && (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsGeneralPaymentOpen(true)}
            >
              Pay toward balance
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-sm text-neutral-400"
              >
                No installments yet.
              </TableCell>
            </TableRow>
          ) : (
            paginatedInstallments.map((inst) => {
              const overdue = isOverdue(inst);

              return (
                <TableRow
                  key={inst.id}
                  className={
                    overdue ? "bg-danger-50/60 hover:bg-danger-50" : undefined
                  }
                >
                  <TableCell className="text-sm text-neutral-700">
                    {new Date(inst.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-neutral-900">
                    {formatCurrency(Number(inst.amount), currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        inst.status === "paid"
                          ? "bg-success-100 text-success-700"
                          : inst.status === "waived"
                            ? "bg-neutral-100 text-neutral-500"
                            : overdue
                              ? "bg-danger-100 text-danger-700"
                              : "bg-warning-100 text-warning-700"
                      }`}
                    >
                      {inst.status === "pending" && overdue
                        ? "overdue"
                        : inst.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isManager && inst.status === "pending" ? (
                      <Button
                        onClick={() => setPayingId(inst.id)}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-xs text-brand-600 hover:text-brand-800"
                      >
                        Pay
                      </Button>
                    ) : (
                      <span className="text-xs text-neutral-400">-</span>
                    )}

                    {payingId === inst.id && (
                      <RecordPaymentForm
                        installmentId={inst.id}
                        accountId={accountId}
                        storeId={storeId}
                        maxAmount={Number(inst.amount)}
                        currency={currency}
                        qrChannels={qrChannels}
                        onDone={() => {
                          setPayingId(null);
                          startTransition(() => router.refresh());
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <PaginationControls
        currentPage={safeCurrentPage}
        pageSize={PAGE_SIZE}
        totalItems={installments.length}
        onPageChange={setCurrentPage}
      />

      {isGeneralPaymentOpen && (
        <RecordGeneralPaymentForm
          accountId={accountId}
          storeId={storeId}
          maxAmount={Number(accountBalanceDue)}
          currency={currency}
          qrChannels={qrChannels}
          onDone={() => {
            setIsGeneralPaymentOpen(false);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}
