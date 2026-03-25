"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createInstallmentAction } from "@/lib/actions/bnpl";
import {
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "@/components/ui/form";

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

      <FormField>
        <FormLabel htmlFor="amount" required>
          Amount
        </FormLabel>
        <FormInput
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="dueDate" required>
          Due Date
        </FormLabel>
        <FormInput
          id="dueDate"
          name="dueDate"
          type="date"
          min={today}
          required
        />
      </FormField>

      <FormError message={state.error} className="col-span-2" />

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
