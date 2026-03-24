"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import type { CurrencyStore } from "@/lib/utils/currency";
import RecordPaymentForm from "./RecordPaymentForm";

type Installment = {
  id: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "waived";
};

export default function InstallmentList({
  installments,
  accountId,
  storeId,
  currency,
  isManager,
}: {
  installments: Installment[];
  accountId: string;
  storeId: string;
  currency: CurrencyStore;
  isManager: boolean;
}) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function isOverdue(inst: Installment) {
    return inst.status === "pending" && new Date(inst.due_date) < new Date();
  }

  return (
    <div className="space-y-2">
      {installments.length === 0 && (
        <p className="text-sm text-neutral-400 py-4 text-center">No installments yet.</p>
      )}
      {installments.map((inst) => (
        <div
          key={inst.id}
          className={`rounded-lg border px-4 py-3 ${
            isOverdue(inst)
              ? "border-danger-200 bg-danger-50"
              : inst.status === "paid"
                ? "border-neutral-200 bg-neutral-50"
                : "border-neutral-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 text-sm">
                {formatCurrency(Number(inst.amount), currency)}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Due: {new Date(inst.due_date).toLocaleDateString()}
                {isOverdue(inst) && (
                  <span className="ml-2 text-danger-600 font-semibold">OVERDUE</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  inst.status === "paid"
                    ? "bg-success-100 text-success-700"
                    : inst.status === "waived"
                      ? "bg-neutral-100 text-neutral-500"
                      : isOverdue(inst)
                        ? "bg-danger-100 text-danger-700"
                        : "bg-warning-100 text-warning-700"
                }`}
              >
                {inst.status === "pending" && isOverdue(inst) ? "overdue" : inst.status}
              </span>
              {isManager && inst.status === "pending" && (
                <button
                  onClick={() => setPayingId(inst.id)}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  Pay
                </button>
              )}
            </div>
          </div>

          {payingId === inst.id && (
            <RecordPaymentForm
              installmentId={inst.id}
              accountId={accountId}
              storeId={storeId}
              maxAmount={Number(inst.amount)}
              onDone={() => {
                setPayingId(null);
                startTransition(() => router.refresh());
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
