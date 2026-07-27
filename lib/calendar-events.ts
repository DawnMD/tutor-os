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
  overrides: {
    id: string;
    type: "MOVED" | "EXTRA";
    date: Date;
    newDate: Date | null;
    startMinutes: number | null;
    endMinutes: number | null;
    reason: string | null;
  }[];
};

/** Org-wide holiday: cancels every batch's template-derived chips that day. */
export type CalendarHoliday = {
  id: string;
  date: Date;
  name: string;
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
    })
  | {
      // Org-level, not tied to any single batch.
      kind: "holiday";
      holidayId: string;
      name: string;
    }
  | (BaseEvent & {
      // The original slot of a MOVED override, struck through on `date`.
      kind: "cancelled";
      overrideId: string;
      startMinutes: number | null;
      endMinutes: number | null;
      movedTo: Date | null;
    })
  | (BaseEvent & {
      // A moved-in / extra class landing on this day.
      kind: "override";
      overrideId: string;
      overrideType: "MOVED" | "EXTRA";
      startMinutes: number;
      endMinutes: number;
      reason: string | null;
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
 * Merge rules on a given day, per batch:
 * - A concrete session wins over everything derived for that batch that day
 *   (template chips, moved-in/extra chips, cancelled markers).
 * - A MOVED override cancels all of that batch's template chips on its `date`
 *   (rendered as a struck-through `cancelled` chip) and emits an `override`
 *   chip on its `newDate`. An EXTRA override emits an `override` chip on `date`.
 * - An org-wide holiday suppresses only template-derived (`schedule`) chips;
 *   sessions, exams and override chips still render (deliberately placed).
 * - Exams are always shown independently.
 */
export function buildEventMap(
  batches: CalendarBatch[],
  gridStart: Date,
  gridEnd: Date,
  holidays: CalendarHoliday[] = [],
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

  const isHoliday = (day: Date) =>
    holidays.some((h) => isSameDay(new Date(h.date), day));

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
        // Session replaces everything derived for this batch this day.
        continue;
      }

      // MOVED whose original occurrence is this day: cancel the template slot.
      const movedOut = batch.overrides.find(
        (o) => o.type === "MOVED" && isSameDay(new Date(o.date), day),
      );
      if (movedOut) {
        const slot = batch.schedules.find((s) => s.dayOfWeek === getDay(day));
        push(day, {
          ...base,
          kind: "cancelled",
          overrideId: movedOut.id,
          startMinutes: slot?.startMinutes ?? null,
          endMinutes: slot?.endMinutes ?? null,
          movedTo: movedOut.newDate ? new Date(movedOut.newDate) : null,
        });
      }

      // Overrides landing on this day: MOVED newDate, or EXTRA date.
      for (const o of batch.overrides) {
        if (o.startMinutes == null || o.endMinutes == null) continue;
        const landsHere =
          o.type === "MOVED"
            ? o.newDate != null && isSameDay(new Date(o.newDate), day)
            : isSameDay(new Date(o.date), day);
        if (!landsHere) continue;
        push(day, {
          ...base,
          kind: "override",
          overrideId: o.id,
          overrideType: o.type,
          startMinutes: o.startMinutes,
          endMinutes: o.endMinutes,
          reason: o.reason,
        });
      }

      // Template chips: suppressed on a holiday day or when moved out.
      if (movedOut || isHoliday(day)) continue;
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

    // Exams are independent of schedules/sessions/overrides/holidays.
    for (const exam of batch.exams) {
      push(new Date(exam.examDate), {
        ...base,
        kind: "exam",
        examId: exam.id,
        title: exam.title,
      });
    }
  }

  // One holiday banner per holiday, above every batch's chips.
  for (const holiday of holidays) {
    push(new Date(holiday.date), {
      kind: "holiday",
      holidayId: holiday.id,
      name: holiday.name,
    });
  }

  // Order within each day: holiday, exam, session, override, schedule, cancelled.
  const rank = (e: CalendarEvent) => {
    switch (e.kind) {
      case "holiday":
        return 0;
      case "exam":
        return 1;
      case "session":
        return 2;
      case "override":
        return 3;
      case "schedule":
        return 4;
      case "cancelled":
        return 5;
    }
  };

  const startOf = (e: CalendarEvent) =>
    e.kind === "schedule" || e.kind === "override" || e.kind === "cancelled"
      ? (e.startMinutes ?? 0)
      : 0;

  for (const list of map.values()) {
    list.sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return startOf(a) - startOf(b);
    });
  }

  return map;
}
