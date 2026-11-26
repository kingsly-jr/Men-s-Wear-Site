/**
 * Formats a numeric or string monetary amount using store currency configuration.
 */
export function formatCurrency(
  amount: number | string,
  currencyCode = "INR",
  locale = "en-IN"
): string {
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) {
    return formatCurrency(0, currencyCode, locale);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Rounds a monetary number safely to 2 decimal places.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
