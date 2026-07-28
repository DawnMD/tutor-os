"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttendanceStatusBadge } from "@/components/student/attendance-status-badge";
import { Badge } from "@/components/ui/badge";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { ClassOccurrence } from "@/lib/student-dashboard-stats";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

export function StudentNextClassCard({
  nextClass,
  today,
}: {
  nextClass: ClassOccurrence | null;
  today: ClassOccurrence[];
}) {
  return (
    <Card data-tour="student-next-class">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Your schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextClass ? (
          <div className="rounded-md border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next class
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  dotClass(nextClass.colorId),
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {nextClass.className} · {nextClass.batchName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {isToday(nextClass.when)
                    ? "Today"
                    : format(nextClass.when, "EEE, MMM d")}
                  {nextClass.timeLabel ? ` · ${nextClass.timeLabel}` : ""}
                </p>
              </div>
              {nextClass.kind === "override" && (
                <Badge variant="secondary">
                  {nextClass.overrideType === "MOVED" ? "Rescheduled" : "Extra"}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                nativeButton={false}
                render={
                  <Link
                    href={nextClass.href}
                    aria-label={`Open ${nextClass.batchName}`}
                  />
                }
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No upcoming classes scheduled.
          </p>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Today
          </p>
          {today.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Nothing scheduled today.
            </p>
          ) : (
            <ul className="divide-y">
              {today.map((entry) => (
                <li
                  key={`${entry.batchId}-${entry.when.getTime()}`}
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
                  ) : entry.kind === "session" && entry.status ? (
                    <AttendanceStatusBadge status={entry.status} />
                  ) : entry.timeLabel ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {entry.timeLabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
