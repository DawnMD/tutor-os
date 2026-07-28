// Money is stored everywhere as integer paise (₹1 = 100 paise) to avoid float
// rounding drift. Forms take rupees; convert at the edge, format for display.

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format an integer paise amount as an INR string, e.g. 150000 → "₹1,500". */
export function formatPaise(paise: number): string {
  return INR.format(paise / 100);
}

/** Convert a rupee amount from a form into integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert integer paise back into rupees (for pre-filling a rupees input). */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}
