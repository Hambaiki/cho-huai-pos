"use client";

import { Button } from "@/components/ui/Button";
import {
  FormError,
  FormField,
  FormInput,
  FormLabel,
  FormTextarea,
} from "@/components/ui/form";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import type { Result } from "@/types/action";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { createBnplAccountAction } from "../actions";
import type { BnplAccountSummary } from "../types";

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
  const [state, formAction, isPending] = useActionState(
    createBnplAccountAction,
    {
      ok: false,
      error: "",
    } as Result<BnplAccountSummary>,
  );
  const router = useRouter();
  const handledAccountIdRef = useRef<string | null>(null);

  useSyncPendingAction(isPending, {
    message: "Creating account…",
  });

  useEffect(() => {
    if (!state.ok) return;
    if (handledAccountIdRef.current === state.data.id) return;

    handledAccountIdRef.current = state.data.id;

    if (onSuccess) {
      onSuccess(state.data);
      return;
    }

    router.push(`/dashboard/store/${storeId}/bnpl/${state.data.id}`);
  }, [onSuccess, router, state, storeId]);

  return (
    <>
      <form action={formAction} className="space-y-5 max-w-lg">
        <input type="hidden" name="storeId" value={storeId} />

        <FormField>
          <FormLabel htmlFor="customerName" required>
            Customer Name
          </FormLabel>
          <FormInput id="customerName" name="customerName" required />
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
            defaultValue={1000}
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

        <FormError message={state.ok ? null : state.error} />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
                return;
              }

              router.push(`/dashboard/store/${storeId}/bnpl`);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : submitLabel}
          </Button>
        </div>
      </form>
    </>
  );
}
