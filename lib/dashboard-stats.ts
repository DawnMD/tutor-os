// Pure derivation logic for the owner dashboard. No React here.
//
// The server (owner.dashboard.getDashboardData) returns org-scoped rows; every
// aggregation below runs client-side so date bucketing stays in the viewer's
// local timezone, matching the calendar page.

import type { Outputs } from "@/orpc/router";
import { resolveBatchColor, type BatchColorId } from "./batch-colors";
import { minutesToTime } from "./calendar-events";
import {
  endOfWeek,
  format,
  getDay,
  isSameDay,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";

export type DashboardData = Outputs["owner"]["dashboard"]["getDashboardData"];
type DashboardBatch = DashboardData["batches"][number];
type SessionAttendance =
  DashboardBatch["sessions"][number]["attendance"][number];

const WEEK_OPTS = { weekStartsOn: 0 } as const;

// Single attendance rule reused everywhere: PRESENT and LATE count as attended;
// EXCUSED is excluded from both numerator and denominator.
function isAttended(status: SessionAttendance["status"]) {
  return status === "PRESENT" || status === "LATE";
}
function countsTowardRate(status: SessionAttendance["status"]) {
  return status === "PRESENT" || status === "LATE" || status === "ABSENT";
}

/** attended / denominator as a 0-100 rate, or null when denominator is 0. */
function rateFrom(attended: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((attended / denominator) * 100);
}

function colorIdOf(batch: DashboardBatch): BatchColorId {
  return resolveBatchColor(batch.color, batch.id).id as BatchColorId;
}

// --- KPIs -------------------------------------------------------------------

export type DashboardKpis = {
  activeStudents: number;
  activeBatches: number;
  classCount: number;
  sessionsCompletedThisWeek: number;
  attendanceRate30d: number | null;
};

export function buildKpis(data: DashboardData, now: Date): DashboardKpis {
  const weekStart = startOfWeek(now, WEEK_OPTS);
  const weekEnd = endOfWeek(now, WEEK_OPTS);
  const cutoff30 = subDays(now, 30);

  let sessionsCompletedThisWeek = 0;
  let attended = 0;
  let denominator = 0;

  for (const batch of data.batches) {
    for (const session of batch.sessions) {
      const date = new Date(session.classDate);
      if (
        session.completedAt != null &&
        date >= weekStart &&
        date <= weekEnd
      ) {
        sessionsCompletedThisWeek += 1;
      }
      if (date >= cutoff30) {
        for (const rec of session.attendance) {
          if (isAttended(rec.status)) attended += 1;
          if (countsTowardRate(rec.status)) denominator += 1;
        }
      }
    }
  }

  return {
    activeStudents: data.activeStudentCount,
    activeBatches: data.batches.length,
    classCount: data.classCount,
    sessionsCompletedThisWeek,
    attendanceRate30d: rateFrom(attended, denominator),
  };
}

// --- Today's schedule -------------------------------------------------------

export type TodayEntry = {
  batchId: string;
  classId: string;
  batchName: string;
  className: string;
  colorId: BatchColorId;
  href: string;
  timeLabel: string | null;
  sortKey: number;
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
      completed: boolean;
      presentCount: number;
      markedCount: number;
    }
);

export type TodaySchedule = {
  holiday: { name: string } | null;
  entries: TodayEntry[];
};

/**
 * Today's entries. Merge rules mirror the calendar's buildEventMap:
 * - a concrete session today wins over everything derived for that batch;
 * - a MOVED override cancels its batch's template rows on its original day and
 *   a moved-in / extra class produces an `override` row on the target day;
 * - an org-wide holiday suppresses only template-derived (`schedule`) rows.
 */
export function buildTodaySchedule(
  data: DashboardData,
  now: Date,
): TodaySchedule {
  const entries: TodayEntry[] = [];
  const todayDow = getDay(now);
  const holidayToday =
    data.holidays.find((h) => isSameDay(new Date(h.date), now)) ?? null;

  for (const batch of data.batches) {
    const base = {
      batchId: batch.id,
      classId: batch.classId,
      batchName: batch.name,
      className: batch.class.name,
      colorId: colorIdOf(batch),
      href: `/class/${batch.classId}/batch/${batch.id}/attendance`,
    };

    const session = batch.sessions.find((s) =>
      isSameDay(new Date(s.classDate), now),
    );

    if (session) {
      let presentCount = 0;
      for (const rec of session.attendance) {
        if (isAttended(rec.status)) presentCount += 1;
      }
      entries.push({
        ...base,
        kind: "session",
        topic: session.topic,
        completed: session.completedAt != null,
        presentCount,
        markedCount: session.attendance.length,
        timeLabel: null,
        sortKey: Number.MAX_SAFE_INTEGER,
      });
      continue;
    }

    const movedOut = batch.overrides.some(
      (o) => o.type === "MOVED" && isSameDay(new Date(o.date), now),
    );

    // Moved-in / extra classes landing today.
    for (const o of batch.overrides) {
      if (o.startMinutes == null || o.endMinutes == null) continue;
      const landsToday =
        o.type === "MOVED"
          ? o.newDate != null && isSameDay(new Date(o.newDate), now)
          : isSameDay(new Date(o.date), now);
      if (!landsToday) continue;
      entries.push({
        ...base,
        kind: "override",
        overrideType: o.type,
        reason: o.reason,
        timeLabel: `${minutesToTime(o.startMinutes)}–${minutesToTime(o.endMinutes)}`,
        sortKey: o.startMinutes,
      });
    }

    // Template rows: suppressed on a holiday or when moved out.
    if (movedOut || holidayToday) continue;
    for (const sch of batch.schedules) {
      if (sch.dayOfWeek === todayDow) {
        entries.push({
          ...base,
          kind: "schedule",
          timeLabel: `${minutesToTime(sch.startMinutes)}–${minutesToTime(sch.endMinutes)}`,
          sortKey: sch.startMinutes,
        });
      }
    }
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return {
    holiday: holidayToday ? { name: holidayToday.name } : null,
    entries,
  };
}

// --- Attendance trend (8 weekly buckets) ------------------------------------

export type TrendBucket = {
  week: string;
  rate: number | null;
  present: number;
  total: number;
};

export function buildAttendanceTrend(
  data: DashboardData,
  now: Date,
): TrendBucket[] {
  const buckets: {
    start: Date;
    end: Date;
    label: string;
    attended: number;
    denominator: number;
  }[] = [];

  for (let i = 7; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), WEEK_OPTS);
    const end = endOfWeek(start, WEEK_OPTS);
    buckets.push({
      start,
      end,
      label: format(start, "MMM d"),
      attended: 0,
      denominator: 0,
    });
  }

  for (const batch of data.batches) {
    for (const session of batch.sessions) {
      const date = new Date(session.classDate);
      const bucket = buckets.find((b) => date >= b.start && date <= b.end);
      if (!bucket) continue;
      for (const rec of session.attendance) {
        if (isAttended(rec.status)) bucket.attended += 1;
        if (countsTowardRate(rec.status)) bucket.denominator += 1;
      }
    }
  }

  return buckets.map((b) => ({
    week: b.label,
    rate: rateFrom(b.attended, b.denominator),
    present: b.attended,
    total: b.denominator,
  }));
}

// --- Students needing attention --------------------------------------------

export type AttentionStudent = {
  studentId: string;
  name: string;
  classId: string;
  batchId: string;
  batchName: string;
  colorId: BatchColorId;
  rate: number;
  total: number;
  consecutiveAbsences: number;
};

type StudentAgg = {
  studentId: string;
  name: string;
  classId: string;
  batchId: string;
  batchName: string;
  colorId: BatchColorId;
  attended: number;
  denominator: number;
  // (date, status) pairs across all batches for absence-streak detection
  records: { date: Date; status: SessionAttendance["status"] }[];
};

export function buildStudentsNeedingAttention(
  data: DashboardData,
  now: Date,
): AttentionStudent[] {
  const cutoff30 = subDays(now, 30);
  const byStudent = new Map<string, StudentAgg>();

  for (const batch of data.batches) {
    const colorId = colorIdOf(batch);

    // Seed roster entries so every student has a home batch for links.
    for (const { student } of batch.students) {
      if (!byStudent.has(student.id)) {
        byStudent.set(student.id, {
          studentId: student.id,
          name: student.fullName ?? student.email,
          classId: batch.classId,
          batchId: batch.id,
          batchName: batch.name,
          colorId,
          attended: 0,
          denominator: 0,
          records: [],
        });
      }
    }

    for (const session of batch.sessions) {
      const date = new Date(session.classDate);
      if (date < cutoff30) continue;
      for (const rec of session.attendance) {
        const agg = byStudent.get(rec.studentId);
        if (!agg) continue; // archived / not on active roster
        if (isAttended(rec.status)) agg.attended += 1;
        if (countsTowardRate(rec.status)) agg.denominator += 1;
        agg.records.push({ date, status: rec.status });
      }
    }
  }

  const result: AttentionStudent[] = [];

  for (const agg of byStudent.values()) {
    if (agg.denominator < 3) continue;
    const rate = Math.round((agg.attended / agg.denominator) * 100);

    // Leading ABSENT streak from most recent session backwards.
    const sorted = agg.records
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    let consecutiveAbsences = 0;
    for (const r of sorted) {
      if (r.status === "ABSENT") consecutiveAbsences += 1;
      else if (r.status === "EXCUSED") continue;
      else break;
    }

    if (rate < 75 || consecutiveAbsences >= 2) {
      result.push({
        studentId: agg.studentId,
        name: agg.name,
        classId: agg.classId,
        batchId: agg.batchId,
        batchName: agg.batchName,
        colorId: agg.colorId,
        rate,
        total: agg.denominator,
        consecutiveAbsences,
      });
    }
  }

  return result.sort((a, b) => a.rate - b.rate).slice(0, 6);
}

// --- Upcoming exams ---------------------------------------------------------

export type UpcomingExam = {
  examId: string;
  title: string;
  examDate: Date;
  batchName: string;
  className: string;
  colorId: BatchColorId;
};

export function buildUpcomingExams(
  data: DashboardData,
  now: Date,
): UpcomingExam[] {
  const today = startOfDay(now);
  const exams: UpcomingExam[] = [];

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

// --- Recent activity --------------------------------------------------------

export type RecentSession = {
  sessionId: string;
  batchName: string;
  className: string;
  colorId: BatchColorId;
  classDate: Date;
  topic: string | null;
  presentCount: number;
  markedCount: number;
};

export type RecentActivity = {
  sessions: RecentSession[];
  students: DashboardData["recentStudents"];
};

export function buildRecentActivity(
  data: DashboardData,
  now: Date,
): RecentActivity {
  const sessions: RecentSession[] = [];

  for (const batch of data.batches) {
    const colorId = colorIdOf(batch);
    for (const session of batch.sessions) {
      const date = new Date(session.classDate);
      if (session.completedAt == null || date > now) continue;
      let presentCount = 0;
      for (const rec of session.attendance) {
        if (isAttended(rec.status)) presentCount += 1;
      }
      sessions.push({
        sessionId: session.id,
        batchName: batch.name,
        className: batch.class.name,
        colorId,
        classDate: date,
        topic: session.topic,
        presentCount,
        markedCount: session.attendance.length,
      });
    }
  }

  sessions.sort((a, b) => b.classDate.getTime() - a.classDate.getTime());

  return { sessions: sessions.slice(0, 5), students: data.recentStudents };
}
