"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createInstallmentAction } from "@/lib/actions/bnpl";

export default function AddInstallmentForm({
  accountId,
  storeId,
}: {
  accountId: string;
  storeId: string;
}) {
  const [state, formAction, isPending] = useActionState(createInstallmentAction, {
    data: null,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    if (state.data) router.refresh();
  }, [state.data, router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="storeId" value={storeId} />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Amount <span className="text-danger-500">*</span>
        </label>
        <input
          name="amount"
          type="number"
          min="1"
          step="1"
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Due Date <span className="text-danger-500">*</span>
        </label>
        <input
          name="dueDate"
          type="date"
          min={today}
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {state.error && (
        <p className="col-span-2 text-sm text-danger-600">{state.error}</p>
      )}

      <div className="col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Adding…" : "Add Installment"}
        </button>
      </div>
    </form>
  );
}
