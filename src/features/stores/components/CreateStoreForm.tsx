"use client";

import {
  FormError,
  FormField,
  FormInput,
  FormLabel,
  FormSelect,
  FormSelectOption,
  FormTextarea,
} from "@/components/ui/form";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import {
  createStoreAction,
  type CreateStoreActionState,
} from "@/features/stores/actions";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";
import { useActionState } from "react";

const initialState: CreateStoreActionState = { error: null };

interface CreateStoreFormProps {
  ctaLabel?: string;
}

export function CreateStoreForm({
  ctaLabel = "Create store",
}: CreateStoreFormProps) {
  const [state, action, isPending] = useActionState(
    createStoreAction,
    initialState,
  );

  useSyncPendingAction(isPending, {
    message: "Creating a new store...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  return (
    <form action={action} className="space-y-4">
      <FormField>
        <FormLabel htmlFor="name" required>
          Store name
        </FormLabel>
        <FormInput id="name" name="name" required type="text" />
      </FormField>

      <FormField>
        <FormLabel htmlFor="address">Address</FormLabel>
        <FormTextarea id="address" name="address" rows={5} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField>
          <FormLabel htmlFor="currency_code" required>
            Currency code
          </FormLabel>
          <FormInput
            defaultValue={DEFAULT_CURRENCY.currency_code}
            id="currency_code"
            maxLength={3}
            name="currency_code"
            required
            type="text"
            className="uppercase"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="currency_symbol" required>
            Currency symbol
          </FormLabel>
          <FormInput
            defaultValue={DEFAULT_CURRENCY.currency_symbol}
            id="currency_symbol"
            maxLength={6}
            name="currency_symbol"
            required
            type="text"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField>
          <FormLabel htmlFor="currency_decimals" required>
            Decimal places
          </FormLabel>
          <FormInput
            defaultValue={DEFAULT_CURRENCY.currency_decimals}
            id="currency_decimals"
            max={4}
            min={0}
            name="currency_decimals"
            required
            type="number"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="symbol_position" required>
            Symbol position
          </FormLabel>
          <FormSelect
            defaultValue={DEFAULT_CURRENCY.symbol_position}
            id="symbol_position"
            name="symbol_position"
          >
            <FormSelectOption value="prefix">Prefix</FormSelectOption>
            <FormSelectOption value="suffix">Suffix</FormSelectOption>
          </FormSelect>
        </FormField>
      </div>

      <FormError message={state.error} />

      <button
        className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating store..." : ctaLabel}
      </button>
    </form>
  );
}
