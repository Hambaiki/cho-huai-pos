"use client";

import { useActionState, useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createBnplAccountAction } from "@/lib/actions/bnpl";
import type { BnplAccountSummary } from "@/lib/types/bnpl";
import {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormError,
} from "@/components/ui/form";

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

      <FormField>
        <FormLabel htmlFor="customerName" required>
          Customer Name
        </FormLabel>
        <FormInput
          id="customerName"
          name="customerName"
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="phone">Phone</FormLabel>
        <FormInput
          id="phone"
          name="phone"
          type="tel"
          placeholder="Optional"
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="creditLimit" required>
          Credit Limit
        </FormLabel>
        <FormInput
          id="creditLimit"
          name="creditLimit"
          type="number"
          min="1"
          step="1"
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="notes">Notes</FormLabel>
        <FormTextarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Optional"
        />
      </FormField>

      <FormError message={state.error} />

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
