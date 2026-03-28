/**
 * Number formatting utilities
 */

/**
 * Format a number using Thai locale with no decimal places.
 * Used for displaying currency amounts and counts.
 * 
 * @example
 * formatNumberThai(1234567) // "1,234,567"
 * formatNumberThai(100) // "100"
 */
export function formatNumberThai(n: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
}

/**
 * Format a number with custom options.
 * 
 * @example
 * formatNumber(1234.56, { maximumFractionDigits: 2 }) // "1,234.56"
 */
export function formatNumber(
  n: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat("th-TH", options).format(n);
}
