"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveBatchColor } from "@/lib/batch-colors";
import type { CalendarEvent } from "@/lib/calendar-events";
import { minutesToTime } from "@/lib/calendar-events";
import { cn } from "@/lib/utils";
import { CheckIcon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";

export type GetEventHref = (event: CalendarEvent) => string;

/** Owner links: exam → overview, session/schedule → sessions (owner-only). */
function ownerEventHref(event: CalendarEvent) {
  if (event.kind === "exam") {
    return `/class/${event.classId}/batch/${event.batchId}/overview`;
  }
  return `/class/${event.classId}/batch/${event.batchId}/sessions`;
}

function eventLabel(event: CalendarEvent) {
  switch (event.kind) {
    case "schedule":
      return `${minutesToTime(event.startMinutes)} ${event.batchName}`;
    case "session":
      return event.topic?.trim() || event.batchName;
    case "exam":
      return event.title;
  }
}

function eventTooltip(event: CalendarEvent) {
  const prefix = `${event.className} · ${event.batchName}`;
  switch (event.kind) {
    case "schedule":
      return `${prefix} — ${minutesToTime(event.startMinutes)}–${minutesToTime(
        event.endMinutes,
      )}`;
    case "session":
      return `${prefix} — ${event.topic?.trim() || "Session"}${
        event.completed ? " (completed)" : ""
      }`;
    case "exam":
      return `${prefix} — Exam: ${event.title}`;
  }
}

export function CalendarEventChip({
  event,
  getEventHref = ownerEventHref,
}: {
  event: CalendarEvent;
  getEventHref?: GetEventHref;
}) {
  const color = resolveBatchColor(event.colorId, event.batchId);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={getEventHref(event)}
            className={cn(
              "flex items-center gap-1 truncate rounded border px-1.5 py-0.5 text-xs",
              color.chip,
              event.kind === "session" && "font-medium",
              event.kind === "exam" && "border-dashed",
            )}
          />
        }
      >
        {event.kind === "session" && event.completed && (
          <CheckIcon className="size-3 shrink-0" />
        )}
        {event.kind === "exam" && (
          <GraduationCapIcon className="size-3 shrink-0" />
        )}
        <span className="truncate">{eventLabel(event)}</span>
      </TooltipTrigger>
      <TooltipContent>{eventTooltip(event)}</TooltipContent>
    </Tooltip>
  );
}
