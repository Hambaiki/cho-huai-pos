"use client";

import { useActionState, useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createBnplAccountAction } from "@/lib/actions/bnpl";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

interface NewBnplAccountFormProps {
  storeId: string;
  onCancel?: () => void;
  onSuccess?: (account: BnplAccountSummary) => void;
  submitLabel?: string;
}

export default function NewBnplAccountForm({
  storeId,
  onCancel,
  onSuccess,
  submitLabel = "Create Account",
}: NewBnplAccountFormProps) {
  const [state, formAction, isPending] = useActionState(createBnplAccountAction, {
    data: null,
    error: null,
  });
  const router = useRouter();
  const handledAccountIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state.data) return;
    if (handledAccountIdRef.current === state.data.id) return;

    handledAccountIdRef.current = state.data.id;

    if (onSuccess) {
      onSuccess(state.data);
      return;
    }

    router.push(`/dashboard/store/${storeId}/bnpl/${state.data.id}`);
  }, [onSuccess, router, state.data, storeId]);

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="storeId" value={storeId} />

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Customer Name <span className="text-danger-500">*</span>
        </label>
        <input
          name="customerName"
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
        <input
          name="phone"
          type="tel"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Credit Limit <span className="text-danger-500">*</span>
        </label>
        <input
          name="creditLimit"
          type="number"
          min="1"
          step="1"
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Optional"
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger-600">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Creating…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
              return;
            }

            router.push(`/dashboard/store/${storeId}/bnpl`);
          }}
          className="px-5 py-2 rounded-lg border border-neutral-300 font-medium text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
