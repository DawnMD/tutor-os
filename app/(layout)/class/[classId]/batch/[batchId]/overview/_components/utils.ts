import { Outputs } from "@/orpc/router";
import { percentage } from "../../exams/_components/utils";

type BatchData = NonNullable<Outputs["owner"]["batch"]["getBatchDataById"]>;
export type OverviewExam = BatchData["exams"][number];

/**
 * Batch-wide average percentage across every recorded result for an exam, or
 * null when nothing has been graded. Mirrors the exams page convention: the
 * mean of each student's percentage against the exam total.
 */
export function examAveragePct(exam: OverviewExam): number | null {
  if (exam.results.length === 0) return null;
  const total = exam.results.reduce(
    (sum, r) => sum + percentage(r.marks, exam.totalMarks),
    0,
  );
  return Math.round(total / exam.results.length);
}
