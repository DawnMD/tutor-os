import { Outputs } from "@/orpc/router";
import {
  differenceInCalendarDays,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

export type SessionsPage = NonNullable<
  Outputs["owner"]["batchSession"]["getSessionsPage"]
>;

export type Session = SessionsPage["sessions"][number];

export type SessionSchedule = SessionsPage["schedules"][number];

/** Temporal lifecycle of a session. */
export type SessionStatus = "completed" | "in_progress" | "draft";

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_LABELS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const SESSION_STATUS_META: Record<
  SessionStatus,
  { label: string; dot: string; badge: string }
> = {
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-blue-500",
    badge:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
  },
  draft: {
    label: "Draft",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
  },
};

/** Format minutes-since-midnight as a 12h clock label, e.g. "5:30 PM". */
export function formatMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Derive a session's lifecycle status. A session is "completed" once the teacher
 * explicitly marks it so (`completedAt`). Until then it's a "draft" if its class
 * date is still in the future, or "in progress" once that date has arrived.
 */
export function getSessionStatus(session: Session): SessionStatus {
  if (session.completedAt) return "completed";
  const date = new Date(session.classDate);
  if (date.getTime() > Date.now() && !isToday(date)) return "draft";
  return "in_progress";
}

/** A conducted (today or past) session that isn't yet marked complete. */
export function isSessionCompletable(session: Session): boolean {
  const date = new Date(session.classDate);
  return !session.completedAt && (isToday(date) || date.getTime() <= Date.now());
}

/** A conducted (today or past) session with no attendance recorded. */
export function isAttendancePending(session: Session): boolean {
  const date = new Date(session.classDate);
  const conducted = isToday(date) || date.getTime() <= Date.now();
  return conducted && session.attendance.length === 0;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export function getAttendanceSummary(session: Session): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: session.attendance.length,
  };
  for (const record of session.attendance) {
    switch (record.status) {
      case "PRESENT":
        summary.present += 1;
        break;
      case "ABSENT":
        summary.absent += 1;
        break;
      case "LATE":
        summary.late += 1;
        break;
      case "EXCUSED":
        summary.excused += 1;
        break;
    }
  }
  return summary;
}

/** Human-friendly relative label: "Today", "Yesterday", "3 days ago", or a date. */
export function relativeDayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  const diff = differenceInCalendarDays(date, new Date());
  if (diff < 0 && diff >= -6) return `${Math.abs(diff)} days ago`;
  if (diff > 0 && diff <= 6) return `In ${diff} days`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Find the next scheduled class relative to now, scanning forward across the
 * weekly schedule (including wrapping into next week).
 */
export function getNextScheduled(
  schedules: SessionSchedule[],
): { day: number; startMinutes: number; endMinutes: number } | null {
  if (schedules.length === 0) return null;
  const now = new Date();
  const today = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const sorted = [...schedules].sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes,
  );

  for (let offset = 0; offset < 7; offset += 1) {
    const day = (today + offset) % 7;
    const candidates = sorted.filter((s) => s.dayOfWeek === day);
    for (const c of candidates) {
      if (offset > 0 || c.startMinutes > nowMinutes) {
        return {
          day: c.dayOfWeek,
          startMinutes: c.startMinutes,
          endMinutes: c.endMinutes,
        };
      }
    }
  }
  // Everything today already passed — wrap to the earliest slot.
  return {
    day: sorted[0].dayOfWeek,
    startMinutes: sorted[0].startMinutes,
    endMinutes: sorted[0].endMinutes,
  };
}
