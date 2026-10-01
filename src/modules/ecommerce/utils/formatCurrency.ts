/** Display rupees without exposing floating-point arithmetic to customers. */
export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value);
  const rounded = Number.isFinite(amount) ? Math.round((amount + Number.EPSILON) * 100) / 100 : 0;
  return `₹${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
