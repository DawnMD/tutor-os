"use client";

import { Button } from "@/components/ui/button";
import { CalendarClock, Play, Plus } from "lucide-react";
import { DAY_LABELS_SHORT, formatMinutes, SessionsPage } from "./utils";

interface SessionsHeaderProps {
  batch: SessionsPage;
  onCreate: () => void;
  onStartToday: () => void;
}

export function SessionsHeader({
  batch,
  onCreate,
  onStartToday,
}: SessionsHeaderProps) {
  const days = [...new Set(batch.schedules.map((s) => s.dayOfWeek))]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS_SHORT[d]);

  // Use the most common time window as the headline schedule.
  const primary = batch.schedules[0];

  return (
    <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {batch.class.name}
          </h1>
          <span className="text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl">
            {batch.name}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {days.length > 0 && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-4" />
              {days.join(" • ")}
            </span>
          )}
          {primary && (
            <span>
              {formatMinutes(primary.startMinutes)} –{" "}
              {formatMinutes(primary.endMinutes)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onStartToday}>
          <Play className="size-4" />
          <span className="hidden sm:inline">Start Today&apos;s Session</span>
          <span className="sm:hidden">Today</span>
        </Button>
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create Session</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}
