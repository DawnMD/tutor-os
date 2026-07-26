"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { resolveBatchColor } from "@/lib/batch-colors";
import { buildEventMap, getGridRange } from "@/lib/calendar-events";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  format,
  startOfMonth,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarDayCell } from "./calendar-day-cell";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { gridStart, gridEnd } = useMemo(() => getGridRange(month), [month]);

  const { data, isLoading } = useQuery(
    orpc.owner.batch.getCalendarData.queryOptions({
      input: { rangeStart: gridStart, rangeEnd: gridEnd },
      placeholderData: keepPreviousData,
    }),
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const eventMap = useMemo(
    () => (data ? buildEventMap(data, gridStart, gridEnd) : new Map()),
    [data, gridStart, gridEnd],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {format(month, "MMMM yyyy")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Legend */}
      {data && data.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {data.map((batch) => {
            const color = resolveBatchColor(batch.color, batch.id);
            return (
              <div
                key={batch.id}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className={cn("size-2 rounded-full", color.dot)} />
                <span>
                  {batch.class.name} · {batch.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-r">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="border-t border-l bg-muted/50 py-1.5 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading && !data ? (
        <div className="grid grid-cols-7 border-r border-b">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="min-h-24 animate-pulse border-t border-l bg-muted/50 sm:min-h-28"
            />
          ))}
        </div>
      ) : data && data.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>No batches yet</EmptyTitle>
            <EmptyDescription>
              Create a class and batch with a schedule to see it on the
              calendar.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-7 border-r border-b">
          {days.map((day) => (
            <CalendarDayCell
              key={day.toISOString()}
              day={day}
              month={month}
              events={eventMap.get(format(day, "yyyy-MM-dd")) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
