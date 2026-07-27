// Pure derivation logic for the student dashboard. No React here.
//
// The server (student.dashboard.getDashboardData) returns student-scoped rows;
// every aggregation below runs client-side so date bucketing stays in the
// viewer's local timezone, matching the calendar page. All nested attendance /
// results arrays are already filtered to the current student server-side
// (length ≤ 1).

import type { Outputs } from "@/orpc/router";
import { resolveBatchColor, type BatchColorId } from "./batch-colors";
import { minutesToTime } from "./calendar-events";
import { addDays, getDay, isSameDay, startOfDay } from "date-fns";

export type StudentDashboardData =
  Outputs["student"]["dashboard"]["getDashboardData"];
type DashboardBatch = StudentDashboardData["batches"][number];
type AttendanceStatus = StudentDashboardData["attendanceTotals"][number]["status"];

// Single attendance rule reused everywhere, matching the owner dashboard:
// PRESENT and LATE count as attended; EXCUSED is excluded from both numerator
// and denominator.
function isAttended(status: AttendanceStatus) {
  return status === "PRESENT" || status === "LATE";
}
function countsTowardRate(status: AttendanceStatus) {
  return status === "PRESENT" || status === "LATE" || status === "ABSENT";
}

function rateFrom(attended: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((attended / denominator) * 100);
}

function colorIdOf(batch: DashboardBatch): BatchColorId {
  return resolveBatchColor(batch.color, batch.id).id as BatchColorId;
}

function ownStatus(
  session: DashboardBatch["sessions"][number],
): AttendanceStatus | null {
  return session.attendance[0]?.status ?? null;
}

// --- Class occurrences (schedules merged with concrete sessions) ------------

export type ClassOccurrence = {
  batchId: string;
  classId: string;
  batchName: string;
  className: string;
  colorId: BatchColorId;
  href: string;
  date: Date;
  when: Date; // date + start time (or start of day when no time is known)
  timeLabel: string | null;
} & (
  | { kind: "schedule" }
  | {
      kind: "override";
      overrideType: "MOVED" | "EXTRA";
      reason: string | null;
    }
  | {
      kind: "session";
      topic: string | null;
      status: AttendanceStatus | null;
      completed: boolean;
    }
);

/**
 * Build class occurrences across `[startOfDay(now), +days)`. Merge rules mirror
 * the calendar's buildEventMap:
 * - a concrete session on a day wins over everything derived for that batch;
 * - a MOVED override cancels its batch's template rows on the original day and
 *   a moved-in / extra class produces an `override` row on the target day;
 * - an org-wide holiday suppresses only template-derived (`schedule`) rows.
 */
function buildOccurrences(
  data: StudentDashboardData,
  now: Date,
  days: number,
): ClassOccurrence[] {
  const from = startOfDay(now);
  const occurrences: ClassOccurrence[] = [];

  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    const dow = getDay(day);
    const isHoliday = data.holidays.some((h) =>
      isSameDay(new Date(h.date), day),
    );

    for (const batch of data.batches) {
      const base = {
        batchId: batch.id,
        classId: batch.classId,
        batchName: batch.name,
        className: batch.class.name,
        colorId: colorIdOf(batch),
        href: `/class/${batch.classId}/batch/${batch.id}/overview`,
        date: day,
      };

      const session = batch.sessions.find((s) =>
        isSameDay(new Date(s.classDate), day),
      );

      // A session's clock time isn't stored; borrow the matching schedule slot
      // for the day (if any) so ordering stays sensible.
      const slot = batch.schedules.find((sch) => sch.dayOfWeek === dow);

      if (session) {
        const startMinutes = slot?.startMinutes ?? null;
        occurrences.push({
          ...base,
          kind: "session",
          topic: session.topic,
          status: ownStatus(session),
          completed: session.completedAt != null,
          when:
            startMinutes == null
              ? startOfDay(day)
              : addMinutes(day, startMinutes),
          timeLabel: slot
            ? `${minutesToTime(slot.startMinutes)}–${minutesToTime(slot.endMinutes)}`
            : null,
        });
        continue;
      }

      const movedOut = batch.overrides.some(
        (o) => o.type === "MOVED" && isSameDay(new Date(o.date), day),
      );

      // Moved-in / extra classes landing this day.
      for (const o of batch.overrides) {
        if (o.startMinutes == null || o.endMinutes == null) continue;
        const landsHere =
          o.type === "MOVED"
            ? o.newDate != null && isSameDay(new Date(o.newDate), day)
            : isSameDay(new Date(o.date), day);
        if (!landsHere) continue;
        occurrences.push({
          ...base,
          kind: "override",
          overrideType: o.type,
          reason: o.reason,
          when: addMinutes(day, o.startMinutes),
          timeLabel: `${minutesToTime(o.startMinutes)}–${minutesToTime(o.endMinutes)}`,
        });
      }

      // Template rows: suppressed on a holiday or when moved out.
      if (movedOut || isHoliday) continue;
      for (const sch of batch.schedules) {
        if (sch.dayOfWeek !== dow) continue;
        occurrences.push({
          ...base,
          kind: "schedule",
          when: addMinutes(day, sch.startMinutes),
          timeLabel: `${minutesToTime(sch.startMinutes)}–${minutesToTime(sch.endMinutes)}`,
        });
      }
    }
  }

  return occurrences.sort((a, b) => a.when.getTime() - b.when.getTime());
}

function addMinutes(day: Date, minutes: number) {
  const d = startOfDay(day);
  d.setMinutes(minutes);
  return d;
}

/** Today's classes (all of today, regardless of time), start-time ordered. */
export function getTodayClasses(
  data: StudentDashboardData,
  now: Date,
): ClassOccurrence[] {
  return buildOccurrences(data, now, 1).filter((o) => isSameDay(o.date, now));
}

/** The soonest class strictly after `now`, scanning the next two weeks. */
export function getNextClass(
  data: StudentDashboardData,
  now: Date,
): ClassOccurrence | null {
  const upcoming = buildOccurrences(data, now, 14).filter(
    (o) => o.when.getTime() > now.getTime(),
  );
  return upcoming[0] ?? null;
}

// --- KPIs -------------------------------------------------------------------

export type StudentLatestResult = {
  examId: string;
  title: string;
  batchName: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  examDate: Date;
};

export type StudentKpis = {
  attendanceRate: number | null;
  batchesEnrolled: number;
  upcomingExams: number;
  latestResult: StudentLatestResult | null;
};

export function getKpis(data: StudentDashboardData, now: Date): StudentKpis {
  let attended = 0;
  let denominator = 0;
  for (const row of data.attendanceTotals) {
    if (isAttended(row.status)) attended += row.count;
    if (countsTowardRate(row.status)) denominator += row.count;
  }

  const today = startOfDay(now);
  let upcomingExams = 0;
  for (const batch of data.batches) {
    for (const exam of batch.exams) {
      if (new Date(exam.examDate) >= today) upcomingExams += 1;
    }
  }

  return {
    attendanceRate: rateFrom(attended, denominator),
    batchesEnrolled: data.batches.length,
    upcomingExams,
    latestResult: getLatestResult(data),
  };
}

function getLatestResult(
  data: StudentDashboardData,
): StudentLatestResult | null {
  let latest: StudentLatestResult | null = null;

  for (const batch of data.batches) {
    for (const exam of batch.exams) {
      const result = exam.results[0];
      if (!result) continue;
      const examDate = new Date(exam.examDate);
      if (latest && examDate <= latest.examDate) continue;
      latest = {
        examId: exam.id,
        title: exam.title,
        batchName: batch.name,
        marks: result.marks,
        totalMarks: exam.totalMarks,
        percentage:
          exam.totalMarks > 0
            ? Math.round((result.marks / exam.totalMarks) * 100)
            : 0,
        examDate,
      };
    }
  }

  return latest;
}

// --- Recent sessions --------------------------------------------------------

export type StudentRecentSession = {
  sessionId: string;
  batchName: string;
  className: string;
  colorId: BatchColorId;
  classDate: Date;
  topic: string | null;
  status: AttendanceStatus | null;
};

export function getRecentSessions(
  data: StudentDashboardData,
  now: Date,
): StudentRecentSession[] {
  const sessions: StudentRecentSession[] = [];

  for (const batch of data.batches) {
    const colorId = colorIdOf(batch);
    for (const session of batch.sessions) {
      const date = new Date(session.classDate);
      if (session.completedAt == null || date > now) continue;
      sessions.push({
        sessionId: session.id,
        batchName: batch.name,
        className: batch.class.name,
        colorId,
        classDate: date,
        topic: session.topic,
        status: ownStatus(session),
      });
    }
  }

  return sessions
    .sort((a, b) => b.classDate.getTime() - a.classDate.getTime())
    .slice(0, 6);
}

// --- Upcoming exams ---------------------------------------------------------

export type StudentUpcomingExam = {
  examId: string;
  title: string;
  examDate: Date;
  batchName: string;
  className: string;
  colorId: BatchColorId;
};

export function getUpcomingExams(
  data: StudentDashboardData,
  now: Date,
): StudentUpcomingExam[] {
  const today = startOfDay(now);
  const exams: StudentUpcomingExam[] = [];

  for (const batch of data.batches) {
    const colorId = colorIdOf(batch);
    for (const exam of batch.exams) {
      const date = new Date(exam.examDate);
      if (date >= today) {
        exams.push({
          examId: exam.id,
          title: exam.title,
          examDate: date,
          batchName: batch.name,
          className: batch.class.name,
          colorId,
        });
      }
    }
  }

  return exams
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .slice(0, 5);
}

// --- Recent results ---------------------------------------------------------

export type StudentRecentResult = {
  examId: string;
  title: string;
  batchName: string;
  colorId: BatchColorId;
  examDate: Date;
  marks: number;
  totalMarks: number;
  percentage: number;
};

export function getRecentResults(
  data: StudentDashboardData,
): StudentRecentResult[] {
  const results: StudentRecentResult[] = [];

  for (const batch of data.batches) {
    const colorId = colorIdOf(batch);
    for (const exam of batch.exams) {
      const result = exam.results[0];
      if (!result) continue;
      results.push({
        examId: exam.id,
        title: exam.title,
        batchName: batch.name,
        colorId,
        examDate: new Date(exam.examDate),
        marks: result.marks,
        totalMarks: exam.totalMarks,
        percentage:
          exam.totalMarks > 0
            ? Math.round((result.marks / exam.totalMarks) * 100)
            : 0,
      });
    }
  }

  return results
    .sort((a, b) => b.examDate.getTime() - a.examDate.getTime())
    .slice(0, 5);
}
