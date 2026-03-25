"use client";

import { useActionState } from "react";
import {
  createStoreAction,
  type CreateStoreActionState,
} from "@/lib/actions/onboarding";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";

const initialState: CreateStoreActionState = { error: null };

interface CreateStoreFormProps {
  ctaLabel?: string;
}

export function CreateStoreForm({
  ctaLabel = "Create store",
}: CreateStoreFormProps) {
  const [state, action, isPending] = useActionState(createStoreAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Store name
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
          id="name"
          name="name"
          required
          type="text"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="address">
          Address
        </label>
        <textarea
          className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
          id="address"
          name="address"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="currency_code">
            Currency code
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none ring-brand-200 transition focus:ring-2"
            defaultValue={DEFAULT_CURRENCY.currency_code}
            id="currency_code"
            maxLength={3}
            name="currency_code"
            required
            type="text"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="currency_symbol">
            Currency symbol
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
            defaultValue={DEFAULT_CURRENCY.currency_symbol}
            id="currency_symbol"
            maxLength={6}
            name="currency_symbol"
            required
            type="text"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="currency_decimals">
            Decimal places
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
            defaultValue={DEFAULT_CURRENCY.currency_decimals}
            id="currency_decimals"
            max={4}
            min={0}
            name="currency_decimals"
            required
            type="number"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="symbol_position">
            Symbol position
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
            defaultValue={DEFAULT_CURRENCY.symbol_position}
            id="symbol_position"
            name="symbol_position"
          >
            <option value="prefix">Prefix</option>
            <option value="suffix">Suffix</option>
          </select>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}

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
