"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { TodaySchedule } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarClock, CalendarOff } from "lucide-react";
import Link from "next/link";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

export function TodayScheduleCard({ schedule }: { schedule: TodaySchedule }) {
  const { holiday, entries } = schedule;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Today&apos;s schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {holiday && (
          <div className="flex items-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm dark:border-rose-800 dark:bg-rose-950/40">
            <CalendarOff className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">Holiday · {holiday.name}</span>
          </div>
        )}
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {holiday ? "No extra classes today." : "No classes scheduled today."}
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry, i) => (
              <li
                key={`${entry.batchId}-${entry.kind}-${entry.sortKey}-${i}`}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    dotClass(entry.colorId),
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.className} · {entry.batchName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.kind === "session"
                      ? (entry.topic ?? "Session")
                      : (entry.timeLabel ?? "Scheduled")}
                  </p>
                </div>
                {entry.kind === "override" ? (
                  <Badge variant="secondary">
                    {entry.overrideType === "MOVED" ? "Rescheduled" : "Extra"}
                  </Badge>
                ) : entry.kind === "session" && entry.completed ? (
                  <Badge variant="secondary">Done</Badge>
                ) : null}
                {entry.timeLabel && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {entry.timeLabel}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  nativeButton={false}
                  render={
                    <Link
                      href={entry.href}
                      aria-label={`Open attendance for ${entry.batchName}`}
                    />
                  }
                >
                  <ArrowRight />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
