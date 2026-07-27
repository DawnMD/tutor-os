// Pure derivation logic for the student per-batch attendance view. No React.
// Date bucketing runs client-side (viewer's local timezone), matching the
// dashboard and calendar.

import type { Outputs } from "@/orpc/router";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { format, startOfMonth, subMonths } from "date-fns";

export type StudentAttendanceData =
  Outputs["student"]["attendance"]["getByBatch"];
export type AttendanceRecordRow = StudentAttendanceData["records"][number];

function isAttended(status: AttendanceStatus) {
  return status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
}
function countsTowardRate(status: AttendanceStatus) {
  return (
    status === AttendanceStatus.PRESENT ||
    status === AttendanceStatus.LATE ||
    status === AttendanceStatus.ABSENT
  );
}

export type AttendanceSummary = {
  rate: number | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

export function summarize(records: AttendanceRecordRow[]): AttendanceSummary {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let attended = 0;
  let denominator = 0;

  for (const rec of records) {
    switch (rec.status) {
      case AttendanceStatus.PRESENT:
        present += 1;
        break;
      case AttendanceStatus.ABSENT:
        absent += 1;
        break;
      case AttendanceStatus.LATE:
        late += 1;
        break;
      case AttendanceStatus.EXCUSED:
        excused += 1;
        break;
    }
    if (isAttended(rec.status)) attended += 1;
    if (countsTowardRate(rec.status)) denominator += 1;
  }

  return {
    rate: denominator === 0 ? null : Math.round((attended / denominator) * 100),
    present,
    absent,
    late,
    excused,
    total: records.length,
  };
}

// --- Monthly trend (last 6 months) -----------------------------------------

export type MonthlyTrendBucket = {
  month: string;
  rate: number | null;
  attended: number;
  total: number;
};

export function monthlyTrend(
  records: AttendanceRecordRow[],
  now: Date,
): MonthlyTrendBucket[] {
  const buckets: {
    start: Date;
    label: string;
    attended: number;
    denominator: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(subMonths(now, i));
    buckets.push({ start, label: format(start, "MMM"), attended: 0, denominator: 0 });
  }

  for (const rec of records) {
    const date = new Date(rec.session.classDate);
    const monthStart = startOfMonth(date);
    const bucket = buckets.find(
      (b) => b.start.getTime() === monthStart.getTime(),
    );
    if (!bucket) continue;
    if (isAttended(rec.status)) bucket.attended += 1;
    if (countsTowardRate(rec.status)) bucket.denominator += 1;
  }

  return buckets.map((b) => ({
    month: b.label,
    rate:
      b.denominator === 0 ? null : Math.round((b.attended / b.denominator) * 100),
    attended: b.attended,
    total: b.denominator,
  }));
}

// --- Filters ----------------------------------------------------------------

export type AttendanceFilter = "ALL" | AttendanceStatus;

export function filterRecords(
  records: AttendanceRecordRow[],
  filter: AttendanceFilter,
): AttendanceRecordRow[] {
  if (filter === "ALL") return records;
  return records.filter((r) => r.status === filter);
}
