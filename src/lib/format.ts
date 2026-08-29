/** Indian number grouping (lakhs/crores) when the symbol is ₹, else en-US. */
function localeFor(symbol: string): string {
  return symbol === "₹" ? "en-IN" : "en-US";
}

export function maskMoney(symbol = ""): string {
  return `${symbol}••••••`;
}

export function formatMoney(value: number, symbol = ""): string {
  const safe = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat(localeFor(symbol), {
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
  return symbol ? `${symbol}${formatted}` : formatted;
}

export function formatMoneyDetailed(value: number, symbol = ""): string {
  const safe = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat(localeFor(symbol), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return symbol ? `${symbol}${formatted}` : formatted;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** easeInOutCubic */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** easeOutCubic */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
