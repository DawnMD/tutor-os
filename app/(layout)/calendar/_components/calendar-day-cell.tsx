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
import { isPastDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { format, isSameMonth, isToday } from "date-fns";
import { CalendarOff } from "lucide-react";
import { CalendarEventChip, type GetEventHref } from "./calendar-event-chip";

const MAX_VISIBLE = 3;
const MAX_DOTS = 4;

interface CalendarDayCellProps {
  day: Date;
  month: Date;
  events: CalendarEvent[];
  getEventHref?: GetEventHref;
  /** Owner-only: clicking blank cell area opens the day-actions dialog. */
  onDayClick?: (day: Date) => void;
}

export function CalendarDayCell({
  day,
  month,
  events,
  getEventHref,
  onDayClick,
}: CalendarDayCellProps) {
  const outsideMonth = !isSameMonth(day, month);
  const today = isToday(day);
  const past = !today && isPastDay(day);

  // Holiday banners render above the chip list; the rest flow as chips/dots.
  const holidays = events.filter((e) => e.kind === "holiday");
  const chips = events.filter((e) => e.kind !== "holiday");
  const visible = chips.slice(0, MAX_VISIBLE);
  const overflow = chips.length - visible.length;
  const interactive = onDayClick != null;

  // Chips are links / popovers — stop clicks there from also opening the dialog.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className={cn(
        "flex min-h-24 flex-col gap-1 border-t border-l p-1 sm:min-h-28",
        // Precedence via tailwind-merge (last conflicting bg-* wins): holiday
        // rose > past/outside muted. Today pill and hover are unaffected.
        past && "bg-muted/30",
        outsideMonth && "bg-muted/30",
        holidays.length > 0 && "bg-rose-50/60 dark:bg-rose-950/20",
        interactive && "cursor-pointer transition-colors hover:bg-muted/40",
      )}
      onClick={interactive ? () => onDayClick(day) : undefined}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center text-xs",
            today &&
              "rounded-full bg-primary font-semibold text-primary-foreground",
            (outsideMonth || past) && !today && "text-muted-foreground",
          )}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Holiday banner(s) */}
      {holidays.map((holiday) =>
        holiday.kind === "holiday" ? (
          <div
            key={holiday.holidayId}
            className="flex items-center gap-1 truncate rounded border border-rose-300 bg-rose-100 px-1.5 py-0.5 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
            title={holiday.name}
          >
            <CalendarOff className="size-3 shrink-0" />
            <span className="truncate">{holiday.name}</span>
          </div>
        ) : null,
      )}

      {/* Dots on narrow screens */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1 sm:hidden">
          {chips.slice(0, MAX_DOTS).map((event, i) => (
            <span
              key={i}
              className={cn(
                "size-2 rounded-full",
                resolveBatchColor(event.colorId, event.batchId).dot,
              )}
            />
          ))}
        </div>
      )}

      {/* Chips on wider screens */}
      <div className="hidden flex-col gap-1 sm:flex" onClick={stop}>
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
                {chips.map((event, i) => (
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
