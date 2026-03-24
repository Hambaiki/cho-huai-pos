export interface CurrencyStore {
  currency_symbol: string;
  currency_code: string;
  currency_decimals: number;
  symbol_position: "prefix" | "suffix";
}

export const DEFAULT_CURRENCY: CurrencyStore = {
  currency_symbol:
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL?.trim() || "฿",
  currency_code: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE?.trim() || "THB",
  currency_decimals: Number(
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_DECIMALS?.trim() || "0",
  ),
  symbol_position:
    process.env.NEXT_PUBLIC_DEFAULT_SYMBOL_POSITION === "suffix"
      ? "suffix"
      : "prefix",
};

export function formatCurrency(amount: number, store: CurrencyStore): string {
  const safeDecimals = Math.min(Math.max(store.currency_decimals, 0), 4);
  const fixed = amount.toFixed(safeDecimals);
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  }).format(Number(fixed));

  if (store.symbol_position === "suffix") {
    return `${formattedNumber} ${store.currency_symbol}`;
  }

  return `${store.currency_symbol} ${formattedNumber}`;
}
