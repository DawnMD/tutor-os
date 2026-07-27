// Pure derivation logic for the student per-batch exam results view. No React.

import type { Outputs } from "@/orpc/router";
import { startOfDay } from "date-fns";

export type StudentExamData = Outputs["student"]["exam"]["getByBatch"];
export type ExamRow = StudentExamData["exams"][number];

export type UpcomingExamItem = {
  id: string;
  title: string;
  examDate: Date;
  totalMarks: number;
};

export type ResultItem = {
  id: string;
  title: string;
  examDate: Date;
  totalMarks: number;
  /** null when the exam is completed but no result has been entered yet. */
  marks: number | null;
  remarks: string | null;
  percentage: number | null;
  pending: boolean;
};

export type ExamSplit = {
  upcoming: UpcomingExamItem[];
  results: ResultItem[];
};

function percentageOf(marks: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((marks / total) * 100);
}

/**
 * Split a batch's exams into upcoming (future, no result yet) and past/graded.
 * A completed exam without a result row is surfaced as "result pending".
 */
export function splitExams(data: StudentExamData, now: Date): ExamSplit {
  const today = startOfDay(now);
  const upcoming: UpcomingExamItem[] = [];
  const results: ResultItem[] = [];

  for (const exam of data.exams) {
    const examDate = new Date(exam.examDate);
    const result = exam.results[0] ?? null;
    const isPast = examDate < today || exam.completedAt != null;

    if (result) {
      results.push({
        id: exam.id,
        title: exam.title,
        examDate,
        totalMarks: exam.totalMarks,
        marks: result.marks,
        remarks: result.remarks,
        percentage: percentageOf(result.marks, exam.totalMarks),
        pending: false,
      });
    } else if (isPast) {
      // Past/completed exam with no entered result → pending.
      results.push({
        id: exam.id,
        title: exam.title,
        examDate,
        totalMarks: exam.totalMarks,
        marks: null,
        remarks: null,
        percentage: null,
        pending: true,
      });
    } else {
      upcoming.push({
        id: exam.id,
        title: exam.title,
        examDate,
        totalMarks: exam.totalMarks,
      });
    }
  }

  upcoming.sort((a, b) => a.examDate.getTime() - b.examDate.getTime());
  results.sort((a, b) => b.examDate.getTime() - a.examDate.getTime());

  return { upcoming, results };
}

export type TrendPoint = {
  label: string;
  percentage: number;
  title: string;
};

/** Chronological percentage series across graded exams (oldest → newest). */
export function performanceTrend(results: ResultItem[]): TrendPoint[] {
  return results
    .filter((r) => r.percentage != null)
    .slice()
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .map((r) => ({
      label: r.title,
      percentage: r.percentage as number,
      title: r.title,
    }));
}

export type ExamKpis = {
  average: number | null;
  best: number | null;
  graded: number;
  upcoming: number;
};

export function examKpis(split: ExamSplit): ExamKpis {
  const graded = split.results.filter((r) => r.percentage != null);
  const pcts = graded.map((r) => r.percentage as number);

  return {
    average:
      pcts.length === 0
        ? null
        : Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    best: pcts.length === 0 ? null : Math.max(...pcts),
    graded: graded.length,
    upcoming: split.upcoming.length,
  };
}
