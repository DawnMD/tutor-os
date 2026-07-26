import { Outputs } from "@/orpc/router";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { isToday } from "date-fns";

export type AttendanceOverview = NonNullable<
  Outputs["owner"]["attendance"]["getAttendanceOverview"]
>;

export type AttendanceSession = AttendanceOverview["sessions"][number];
export type AttendanceStudent = AttendanceOverview["students"][number];
export type AttendanceSchedule = AttendanceOverview["schedules"][number];
export type SessionRecord = AttendanceSession["attendance"][number];

export const DAY_LABELS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/** The order status buttons appear in, left to right. */
export const STATUS_ORDER: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.LATE,
  AttendanceStatus.EXCUSED,
];

type StatusMeta = {
  label: string;
  short: string;
  /** Single-key shortcuts that set this status for the focused row. */
  keys: string[];
  dot: string;
  /** Text colour used for the value / selected label. */
  text: string;
  /** Full styling applied to the segmented button when this status is active. */
  active: string;
};

export const STATUS_META: Record<AttendanceStatus, StatusMeta> = {
  [AttendanceStatus.PRESENT]: {
    label: "Present",
    short: "P",
    keys: ["p", "1"],
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    active:
      "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300",
  },
  [AttendanceStatus.ABSENT]: {
    label: "Absent",
    short: "A",
    keys: ["a", "2"],
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    active:
      "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300",
  },
  [AttendanceStatus.LATE]: {
    label: "Late",
    short: "L",
    keys: ["l", "3"],
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    active:
      "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300",
  },
  [AttendanceStatus.EXCUSED]: {
    label: "Excused",
    short: "E",
    keys: ["e", "4"],
    dot: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    active:
      "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300",
  },
};

export interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Number of students with any status recorded. */
  marked: number;
}

export function emptyCounts(): AttendanceCounts {
  return { present: 0, absent: 0, late: 0, excused: 0, marked: 0 };
}

export function countStatuses(
  statuses: Iterable<AttendanceStatus | null | undefined>,
): AttendanceCounts {
  const counts = emptyCounts();
  for (const status of statuses) {
    if (!status) continue;
    counts.marked += 1;
    switch (status) {
      case AttendanceStatus.PRESENT:
        counts.present += 1;
        break;
      case AttendanceStatus.ABSENT:
        counts.absent += 1;
        break;
      case AttendanceStatus.LATE:
        counts.late += 1;
        break;
      case AttendanceStatus.EXCUSED:
        counts.excused += 1;
        break;
    }
  }
  return counts;
}

export function sessionCounts(session: AttendanceSession): AttendanceCounts {
  return countStatuses(session.attendance.map((r) => r.status));
}

/** Present + late count as attended for attendance-rate purposes. */
export function attendedFromCounts(counts: AttendanceCounts): number {
  return counts.present + counts.late;
}

export function percentage(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/** A session's attendance rate (present + late over students marked). */
export function sessionRate(session: AttendanceSession): number | null {
  const counts = sessionCounts(session);
  if (counts.marked === 0) return null;
  return percentage(attendedFromCounts(counts), counts.marked);
}

/** True once the teacher has explicitly closed the session. */
export function isCompleted(session: AttendanceSession): boolean {
  return Boolean(session.completedAt);
}

/** A session whose class date has arrived (today or earlier). */
export function isConducted(session: AttendanceSession): boolean {
  const date = new Date(session.classDate);
  return isToday(date) || date.getTime() <= Date.now();
}

export type SessionStatus = "completed" | "in_progress" | "upcoming";

export function sessionStatus(session: AttendanceSession): SessionStatus {
  if (session.completedAt) return "completed";
  return isConducted(session) ? "in_progress" : "upcoming";
}

export type SessionDisplayStatus = SessionStatus | "no_attendance";

/** Like sessionStatus, but flags completed sessions with nothing marked. */
export function sessionDisplayStatus(
  s: AttendanceSession,
): SessionDisplayStatus {
  const status = sessionStatus(s);
  if (status === "completed" && sessionCounts(s).marked === 0) {
    return "no_attendance";
  }
  return status;
}

export const SESSION_STATUS_META: Record<
  SessionDisplayStatus,
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
  upcoming: {
    label: "Upcoming",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
  },
  no_attendance: {
    label: "No attendance",
    dot: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  },
};

/**
 * Which session should open by default in the marking sheet: today's session
 * if one exists, otherwise the most recent conducted session that isn't yet
 * complete, otherwise the latest session of all. Sessions arrive newest-first.
 */
export function resolveActiveSession(
  sessions: AttendanceSession[],
): AttendanceSession | null {
  if (sessions.length === 0) return null;
  const today = sessions.find((s) => isToday(new Date(s.classDate)));
  if (today) return today;
  const openConducted = sessions.find(
    (s) => isConducted(s) && !s.completedAt,
  );
  if (openConducted) return openConducted;
  return sessions[0];
}

/** The session immediately before `session` in time (for "Copy Previous"). */
export function previousSession(
  sessions: AttendanceSession[],
  session: AttendanceSession,
): AttendanceSession | null {
  const target = new Date(session.classDate).getTime();
  // Sessions are newest-first; the first one strictly older wins.
  for (const candidate of sessions) {
    if (new Date(candidate.classDate).getTime() < target) return candidate;
  }
  return null;
}

/** Build two-letter initials for the avatar fallback. */
export function getInitials(name?: string | null, email?: string): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/** Format minutes-since-midnight as a 12h clock label, e.g. "5:30 PM". */
export function formatMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
}

export interface StudentSummary {
  student: AttendanceStudent;
  counts: AttendanceCounts;
  /** Number of conducted sessions this student had a record in. */
  total: number;
  rate: number;
}

/**
 * Per-student attendance across every conducted session in the batch, sorted by
 * rate ascending so the students needing attention surface first.
 */
export function buildStudentSummaries(
  overview: AttendanceOverview,
): StudentSummary[] {
  const conducted = overview.sessions.filter(isConducted);
  const byStudent = new Map<string, AttendanceStatus[]>();
  for (const student of overview.students) {
    byStudent.set(student.id, []);
  }
  for (const session of conducted) {
    for (const record of session.attendance) {
      byStudent.get(record.studentId)?.push(record.status);
    }
  }

  return overview.students
    .map((student) => {
      const statuses = byStudent.get(student.id) ?? [];
      const counts = countStatuses(statuses);
      return {
        student,
        counts,
        total: counts.marked,
        rate: percentage(attendedFromCounts(counts), counts.marked),
      };
    })
    .sort((a, b) => {
      // Students with no records sink to the bottom; otherwise lowest first.
      if (a.total === 0 && b.total === 0) return 0;
      if (a.total === 0) return 1;
      if (b.total === 0) return -1;
      return a.rate - b.rate;
    });
}

export const LOW_ATTENDANCE_THRESHOLD = 75;
