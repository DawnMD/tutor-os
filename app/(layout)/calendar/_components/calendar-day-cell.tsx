"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { resolveBatchColor } from "@/lib/batch-colors";
import type { CalendarEvent } from "@/lib/calendar-events";
import { cn } from "@/lib/utils";
import { format, isSameMonth, isToday } from "date-fns";
import { CalendarEventChip, type GetEventHref } from "./calendar-event-chip";

const MAX_VISIBLE = 3;
const MAX_DOTS = 4;

interface CalendarDayCellProps {
  day: Date;
  month: Date;
  events: CalendarEvent[];
  getEventHref?: GetEventHref;
}

export function CalendarDayCell({
  day,
  month,
  events,
  getEventHref,
}: CalendarDayCellProps) {
  const outsideMonth = !isSameMonth(day, month);
  const today = isToday(day);
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - visible.length;

  return (
    <div
      className={cn(
        "flex min-h-24 flex-col gap-1 border-t border-l p-1 sm:min-h-28",
        outsideMonth && "bg-muted/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center text-xs",
            today &&
              "rounded-full bg-primary font-semibold text-primary-foreground",
            outsideMonth && !today && "text-muted-foreground",
          )}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Dots on narrow screens */}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1 sm:hidden">
          {events.slice(0, MAX_DOTS).map((event, i) => {
            const color = resolveBatchColor(event.colorId, event.batchId);
            return (
              <span
                key={i}
                className={cn("size-2 rounded-full", color.dot)}
              />
            );
          })}
        </div>
      )}

      {/* Chips on wider screens */}
      <div className="hidden flex-col gap-1 sm:flex">
        {visible.map((event, i) => (
          <CalendarEventChip key={i} event={event} getEventHref={getEventHref} />
        ))}

        {overflow > 0 && (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-auto justify-start px-1.5 py-0.5 text-xs normal-case tracking-normal text-muted-foreground"
                />
              }
            >
              +{overflow} more
            </PopoverTrigger>
            <PopoverContent className="w-64 gap-2">
              <PopoverHeader>
                <PopoverTitle>{format(day, "EEEE, MMM d")}</PopoverTitle>
              </PopoverHeader>
              <div className="flex flex-col gap-1">
                {events.map((event, i) => (
                  <CalendarEventChip
                    key={i}
                    event={event}
                    getEventHref={getEventHref}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
