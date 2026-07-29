// Fee periods are calendar months, addressed as { year, month } with month in
// 1-12. Dues are computed on the fly (never materialized), so this pure,
// isomorphic module is shared by the owner and student routers AND the client
// so that "which months does a student owe" is computed identically everywhere.
//
// "Identically" is why nothing here reads a Date's *local* fields. The server
// runs in UTC (Vercel) while the tutor's browser runs in IST, so local-time math
// puts a student who joined at 2026-08-01 02:00 IST (stored 2026-07-31T20:30Z)
// in July on the server and August in the browser — a whole month of dues
// appearing on one screen and not the other. Every boundary below is anchored
// to FEE_TIMEZONE instead.

/** The one zone every fee-period boundary is anchored to. India/INR-only product. */
export const FEE_TIMEZONE = "Asia/Kolkata";

/**
 * IST is UTC+5:30 year-round — India has not observed DST since 1945 — so a
 * fixed offset is exact here and keeps these helpers pure and synchronous. If a
 * DST-observing zone is ever needed, replace `toZoned`/`fromZoned` with
 * Intl.DateTimeFormat part extraction; they are the only two functions in this
 * module that touch the instant ⇄ wall-clock conversion.
 */
const FEE_TZ_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * Shift an instant so its UTC fields read as FEE_TIMEZONE wall-clock time.
 * The result is only meaningful via its `getUTC*` accessors.
 */
function toZoned(instant: Date): Date {
  return new Date(instant.getTime() + FEE_TZ_OFFSET_MS);
}

/** Turn FEE_TIMEZONE wall-clock fields back into a real instant. */
function fromZoned(
  year: number,
  monthIndex: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
): Date {
  return new Date(
    Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms) -
      FEE_TZ_OFFSET_MS,
  );
}

export interface FeePeriod {
  year: number;
  /** 1-12 */
  month: number;
}

/** The last instant of the given month in FEE_TIMEZONE. */
export function monthEnd(year: number, month: number): Date {
  // Day 0 of the next month === last day of this month (month here is 1-based,
  // which is exactly the 0-based index of the *next* month).
  return fromZoned(year, month, 0, 23, 59, 59, 999);
}

/** The first instant of the given month in FEE_TIMEZONE. */
export function monthStart(year: number, month: number): Date {
  return fromZoned(year, month - 1, 1, 0, 0, 0, 0);
}

/** The calendar month an instant falls in, as seen from FEE_TIMEZONE. */
export function periodOf(instant: Date): FeePeriod {
  const zoned = toZoned(instant);
  return { year: zoned.getUTCFullYear(), month: zoned.getUTCMonth() + 1 };
}

/** The calendar month `now` falls in. */
export function currentPeriod(now: Date = new Date()): FeePeriod {
  return periodOf(now);
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
  let { year, month } = periodOf(joinedAt);

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
