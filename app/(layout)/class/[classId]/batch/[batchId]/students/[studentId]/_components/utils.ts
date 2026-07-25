import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { Outputs } from "@/orpc/router";

export type StudentDashboard = NonNullable<
  Outputs["owner"]["batchStudent"]["getStudentDashboard"]
>;

export type AttendanceEntry = StudentDashboard["attendance"][number];
export type ExamEntry = StudentDashboard["examResults"][number];

/** Build the two-letter initials shown in the avatar fallback. */
export function getInitials(name?: string | null, email?: string): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

type StatusStyle = {
  label: string;
  /** Colored text/dot classes, matching the flat badge aesthetic. */
  className: string;
  dot: string;
};

export const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatus, StatusStyle> = {
  [AttendanceStatus.PRESENT]: {
    label: "Present",
    className: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  [AttendanceStatus.ABSENT]: {
    label: "Absent",
    className: "text-destructive",
    dot: "bg-destructive",
  },
  [AttendanceStatus.LATE]: {
    label: "Late",
    className: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  [AttendanceStatus.EXCUSED]: {
    label: "Excused",
    className: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
};

/** A class is "attended" when the student was present or arrived late. */
export function isAttended(status: AttendanceStatus): boolean {
  return status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
}

export function percentage(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/** Letter grade from a percentage score. */
export function gradeFromPercentage(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

export function gradeColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}
