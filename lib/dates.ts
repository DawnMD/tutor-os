// Pure date helpers shared by client components and oRPC routers (no React).
// Centralizes the "no past dates" rule; see per-router doc comments for the
// timezone convention (clients send local-midnight Dates; the server never does
// day-equality math).

import { isBefore, isSameDay, startOfDay, startOfToday } from "date-fns";

/** True when `date`'s calendar day is strictly before today (local time). */
export function isPastDay(date: Date): boolean {
  return isBefore(startOfDay(date), startOfToday());
}

/**
 * react-day-picker `disabled` matcher: every day before today, except `keep`
 * (an edit dialog's original date, which must stay selectable).
 */
export function pastDayMatcher(keep?: Date): (day: Date) => boolean {
  return (day) => isPastDay(day) && !(keep != null && isSameDay(day, keep));
}

/**
 * Server grace window. Clients send local-midnight dates; a valid "today"
 * from UTC+14 can be ~24h behind server time. 48h adds slop for clock skew
 * so no legitimate same-day create is ever rejected; strict day-level
 * blocking lives client-side.
 */
export const PAST_DATE_GRACE_MS = 48 * 60 * 60 * 1000;

export function isBeyondPastGrace(date: Date, now: Date = new Date()): boolean {
  return now.getTime() - date.getTime() > PAST_DATE_GRACE_MS;
}
