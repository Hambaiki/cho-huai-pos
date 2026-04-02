"use client";

import {
  FormDateTimeSelect,
  FormError,
  FormField,
  FormInput,
  FormLabel,
} from "@/components/ui/form";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import type { Result } from "@/types/action";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { createInstallmentAction } from "../actions";

interface AddInstallmentFormProps {
  accountId: string;
  storeId: string;
  onSuccess?: () => void;
}

export default function AddInstallmentForm({
  accountId,
  storeId,
  onSuccess,
}: AddInstallmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    createInstallmentAction,
    {
      ok: false,
      error: "",
    } as Result<{ id: string }>,
  );
  const router = useRouter();

  useSyncPendingAction(isPending, {
    message: "Adding installment...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onSuccess?.();
    }
  }, [state, router, onSuccess]);

  const today = new Date();

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="storeId" value={storeId} />

      <FormField>
        <FormLabel htmlFor="amount" required>
          Amount
        </FormLabel>
        <FormInput
          id="amount"
          name="amount"
          type="number"
          placeholder="0"
          min="1"
          step="1"
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="dueDate" required>
          Due Date
        </FormLabel>
        <FormDateTimeSelect
          id="dueDate"
          name="dueDate"
          mode="date"
          minDate={today}
          placeholder="Select due date"
          required
        />
      </FormField>

      <FormError
        message={state.ok ? null : state.error}
        className="col-span-2"
      />

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
