"use client";

import type { CurrencyStore } from "@/lib/utils/currency";
import { Delete } from "lucide-react";

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  currency: CurrencyStore;
}

const DIGIT_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
];

export function Numpad({ value, onChange, currency }: NumpadProps) {
  const hasDecimal = currency.currency_decimals > 0;

  const handleDigit = (digit: string) => {
    if (digit === "." && !hasDecimal) return;
    if (digit === "." && value.includes(".")) return;

    // Prevent too many decimal places
    if (value.includes(".")) {
      const [, dec] = value.split(".");
      if (dec !== undefined && dec.length >= currency.currency_decimals) return;
    }

    // Prevent leading zeros (e.g. "00" → keep as "0")
    if ((value === "0" || value === "") && digit !== ".") {
      onChange(digit);
      return;
    }

    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (value.length <= 1) {
      onChange("0");
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => onChange("0");

  const displayValue = value || "0";

  return (
    <div className="space-y-2">
      {/* Value display */}
      <div className="flex items-center justify-end rounded-xl border border-border bg-neutral-50 px-4 py-3">
        <span className="text-3xl font-bold tabular-nums text-neutral-900 tracking-tight">
          {currency.symbol_position === "prefix"
            ? `${currency.currency_symbol} ${displayValue}`
            : `${displayValue} ${currency.currency_symbol}`}
        </span>
      </div>

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-2">
        {DIGIT_ROWS.flat().map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleDigit(key)}
            className="select-none rounded-xl border border-border bg-white py-4 text-xl font-semibold text-neutral-900 transition active:scale-95 active:bg-neutral-100 hover:bg-neutral-50"
          >
            {key}
          </button>
        ))}

        {/* Bottom row: decimal / 0 / backspace */}
        <button
          type="button"
          onClick={() => handleDigit(".")}
          disabled={!hasDecimal}
          className="select-none rounded-xl border border-border bg-white py-4 text-xl font-semibold text-neutral-900 transition active:scale-95 active:bg-neutral-100 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-25"
        >
          .
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="select-none rounded-xl border border-border bg-white py-4 text-xl font-semibold text-neutral-900 transition active:scale-95 active:bg-neutral-100 hover:bg-neutral-50"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          aria-label="Backspace"
          className="select-none rounded-xl border border-border bg-white py-4 text-xl font-semibold text-neutral-700 transition active:scale-95 active:bg-neutral-100 hover:bg-neutral-50 flex items-center justify-center"
        >
          <Delete />
        </button>
      </div>

      {/* Clear button */}
      <button
        type="button"
        onClick={handleClear}
        className="w-full select-none rounded-xl border border-neutral-200 bg-neutral-100 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200 active:scale-95"
      >
        Clear
      </button>
    </div>
  );
}
