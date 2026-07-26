import { Outputs } from "@/orpc/router";

export type ExamsPage = NonNullable<Outputs["owner"]["exam"]["getExamsPage"]>;

export type ExamRow = ExamsPage["exams"][number];

export type ExamDetail = NonNullable<Outputs["owner"]["exam"]["getExamDetail"]>;

export type ExamStudent = ExamDetail["students"][number];

/** Percentage of a score against a total, rounded to a whole number. */
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

/** Text colour keyed to a percentage band. */
export function gradeColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

/** An exam whose date is still in the future (relative to now). */
export function isUpcoming(exam: Pick<ExamRow, "examDate">): boolean {
  return new Date(exam.examDate).getTime() > Date.now();
}

/** True once the teacher has explicitly completed (locked) the exam. */
export function isCompleted(exam: Pick<ExamRow, "completedAt">): boolean {
  return Boolean(exam.completedAt);
}

/** Lifecycle status used for badges. Completion takes priority over date. */
export type ExamStatus = "completed" | "upcoming" | "pending";

export function getExamStatus(
  exam: Pick<ExamRow, "examDate" | "completedAt">,
): ExamStatus {
  if (exam.completedAt) return "completed";
  return isUpcoming(exam) ? "upcoming" : "pending";
}

export const EXAM_STATUS_META: Record<
  ExamStatus,
  { label: string; dot: string; badge: string }
> = {
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  },
  upcoming: {
    label: "Upcoming",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
  },
  pending: {
    label: "Grading pending",
    dot: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  },
};

/** How many active students have a recorded result for this exam. */
export function gradedCount(exam: ExamRow): number {
  return exam.results.length;
}

/** Batch-wide average percentage across every recorded result for an exam. */
export function examAverage(exam: ExamRow): number | null {
  if (exam.results.length === 0) return null;
  const total = exam.results.reduce(
    (sum, r) => sum + percentage(r.marks, exam.totalMarks),
    0,
  );
  return Math.round(total / exam.results.length);
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
