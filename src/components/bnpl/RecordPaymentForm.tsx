"use client";

import { useActionState } from "react";
import { recordBnplPaymentAction } from "@/lib/actions/bnpl";

export default function RecordPaymentForm({
  installmentId,
  accountId,
  storeId,
  maxAmount,
  onDone,
}: {
  installmentId: string;
  accountId: string;
  storeId: string;
  maxAmount: number;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(recordBnplPaymentAction, {
    data: null,
    error: null,
  });

  if (state.data !== null) {
    // Payment recorded — parent will refresh
    onDone();
  }

  return (
    <form action={formAction} className="space-y-4 mt-4">
      <input type="hidden" name="installmentId" value={installmentId} />
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="storeId" value={storeId} />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Amount Paid
        </label>
        <input
          name="amountPaid"
          type="number"
          min="0.01"
          step="0.01"
          max={maxAmount}
          defaultValue={maxAmount}
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Payment Method
        </label>
        <select
          name="paymentMethod"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="cash">Cash</option>
          <option value="qr_transfer">QR Transfer</option>
          <option value="card">Card</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
        <input
          name="note"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Optional"
        />
      </div>

      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Recording…" : "Record Payment"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
