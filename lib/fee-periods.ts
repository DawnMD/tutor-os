// Fee periods are calendar months, addressed as { year, month } with month in
// 1-12. Dues are computed on the fly (never materialized), so this pure,
// isomorphic module is shared by the owner and student routers AND the client
// so that "which months does a student owe" is computed identically everywhere.

export interface FeePeriod {
  year: number;
  /** 1-12 */
  month: number;
}

/** The last instant of the given month (local time). */
export function monthEnd(year: number, month: number): Date {
  // Day 0 of the next month === last day of this month (month here is 1-based,
  // which is exactly the 0-based index of the *next* month).
  return new Date(year, month, 0, 23, 59, 59, 999);
}

/** The first instant of the given month (local time). */
export function monthStart(year: number, month: number): Date {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

/** The calendar month `now` falls in. */
export function currentPeriod(now: Date = new Date()): FeePeriod {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Order two periods: negative if a is earlier, positive if later, 0 if equal. */
export function comparePeriods(a: FeePeriod, b: FeePeriod): number {
  return a.year - b.year || a.month - b.month;
}

/** Stable string key for a period, handy for Map/Set lookups. */
export function periodKey(period: FeePeriod): string {
  return `${period.year}-${period.month}`;
}

/**
 * Every period a student owes: their join month through the current month,
 * inclusive. No proration — the join month is owed in full.
 */
export function duePeriodsSince(joinedAt: Date, now: Date = new Date()): FeePeriod[] {
  const end = currentPeriod(now);
  const periods: FeePeriod[] = [];
  let year = joinedAt.getFullYear();
  let month = joinedAt.getMonth() + 1;

  while (comparePeriods({ year, month }, end) <= 0) {
    periods.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return periods;
}

/** True when a period is not in the future relative to `now`. */
export function isPayablePeriod(period: FeePeriod, now: Date = new Date()): boolean {
  return comparePeriods(period, currentPeriod(now)) <= 0;
}

/** True when month is a whole number in 1-12 and year looks sane. */
export function isValidPeriod(period: FeePeriod): boolean {
  return (
    Number.isInteger(period.year) &&
    period.year >= 2000 &&
    period.year <= 2100 &&
    Number.isInteger(period.month) &&
    period.month >= 1 &&
    period.month <= 12
  );
}

/**
 * Whether a fee is due for (joinedAt, period) at time `now`: the student must
 * have joined on or before the period's month end, and the period must not be
 * in the future. (Fee-set and enrollment checks live in the routers.)
 */
export function isDueForPeriod(
  joinedAt: Date,
  period: FeePeriod,
  now: Date = new Date(),
): boolean {
  return (
    isPayablePeriod(period, now) &&
    joinedAt.getTime() <= monthEnd(period.year, period.month).getTime()
  );
}
