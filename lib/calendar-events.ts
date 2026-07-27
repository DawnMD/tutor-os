// Pure event-building logic for the calendar page. No React here.

import {
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { resolveBatchColor, type BatchColorId } from "./batch-colors";

/**
 * Standalone structural shape the calendar consumes. Both the owner
 * (`owner.batch.getCalendarData`) and student (`student.calendar.getCalendarData`)
 * router outputs satisfy this, so the calendar components can render either
 * role's data without coupling to a single router.
 */
export type CalendarBatch = {
  id: string;
  name: string;
  color: string | null;
  classId: string;
  class: { name: string };
  schedules: {
    dayOfWeek: number;
    startMinutes: number;
    endMinutes: number;
  }[];
  sessions: {
    id: string;
    classDate: Date;
    topic: string | null;
    completedAt: Date | null;
  }[];
  exams: {
    id: string;
    title: string;
    examDate: Date;
  }[];
};

/** Fields every event carries regardless of kind. */
type BaseEvent = {
  batchId: string;
  classId: string;
  batchName: string;
  className: string;
  colorId: BatchColorId;
};

export type CalendarEvent =
  | (BaseEvent & {
      kind: "schedule";
      startMinutes: number;
      endMinutes: number;
    })
  | (BaseEvent & {
      kind: "session";
      sessionId: string;
      topic: string | null;
      completed: boolean;
    })
  | (BaseEvent & {
      kind: "exam";
      examId: string;
      title: string;
    });

const DATE_KEY = "yyyy-MM-dd";

export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** The 42-cell (6-week) grid window that contains the given month. */
export function getGridRange(month: Date) {
  return {
    gridStart: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    gridEnd: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  };
}

/**
 * Build a map of `yyyy-MM-dd` -> events for every day in [gridStart, gridEnd].
 *
 * Merge rule: on a given day, if a batch has a concrete session that day, the
 * session replaces all of that batch's schedule-derived chips (sessions are
 * unique per batch+date). Exams are always shown independently.
 */
export function buildEventMap(
  batches: CalendarBatch[],
  gridStart: Date,
  gridEnd: Date,
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  const push = (day: Date, event: CalendarEvent) => {
    const key = format(day, DATE_KEY);
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  };

  // Iterate every day in the grid window once.
  const days: Date[] = [];
  for (
    let d = new Date(gridStart);
    d <= gridEnd;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    days.push(d);
  }

  for (const batch of batches) {
    const base: BaseEvent = {
      batchId: batch.id,
      classId: batch.classId,
      batchName: batch.name,
      className: batch.class.name,
      colorId: resolveBatchColor(batch.color, batch.id).id as BatchColorId,
    };

    for (const day of days) {
      const session = batch.sessions.find((s) =>
        isSameDay(new Date(s.classDate), day),
      );

      if (session) {
        push(day, {
          ...base,
          kind: "session",
          sessionId: session.id,
          topic: session.topic,
          completed: session.completedAt != null,
        });
        // Session replaces this batch's schedule chips for the day.
        continue;
      }

      for (const sch of batch.schedules) {
        if (sch.dayOfWeek === getDay(day)) {
          push(day, {
            ...base,
            kind: "schedule",
            startMinutes: sch.startMinutes,
            endMinutes: sch.endMinutes,
          });
        }
      }
    }

    // Exams are independent of schedules/sessions.
    for (const exam of batch.exams) {
      push(new Date(exam.examDate), {
        ...base,
        kind: "exam",
        examId: exam.id,
        title: exam.title,
      });
    }
  }

  // Order within each day: exams, then sessions, then schedules by start time.
  const rank = (e: CalendarEvent) =>
    e.kind === "exam" ? 0 : e.kind === "session" ? 1 : 2;

  for (const list of map.values()) {
    list.sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      if (a.kind === "schedule" && b.kind === "schedule") {
        return a.startMinutes - b.startMinutes;
      }
      return 0;
    });
  }

  return map;
}
