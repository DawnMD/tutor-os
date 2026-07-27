"use client";

import { StudentArchivedState } from "@/components/student/student-archived-state";
import { AttendanceStatusBadge } from "@/components/student/attendance-status-badge";
import { StudentGate } from "@/components/student/student-gate";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchivedScope } from "@/lib/archived-error";
import { resolveBatchColor } from "@/lib/batch-colors";
import { minutesToTime } from "@/lib/calendar-events";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, FolderOpen } from "lucide-react";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StudentBatchOverview({ batchId }: { batchId: string }) {
  return (
    <StudentGate>
      <StudentBatchOverviewBody batchId={batchId} />
    </StudentGate>
  );
}

function StudentBatchOverviewBody({ batchId }: { batchId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    ...orpc.student.batch.getOverview.queryOptions({ input: { batchId } }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError) {
    const scope = getArchivedScope(error);
    if (scope === "batch" || scope === "class") {
      return <StudentArchivedState scope={scope} />;
    }
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>Batch not available</EmptyTitle>
          <EmptyDescription>
            This batch doesn&apos;t exist or you&apos;re not enrolled in it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) return null;

  const color = resolveBatchColor(data.color, data.id);
  const schedules = [...data.schedules].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className={cn("size-3 shrink-0 rounded-full", color.dot)} />
        <div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">{data.class.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              Recent sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.sessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No sessions recorded yet.
              </p>
            ) : (
              <ul className="divide-y">
                {data.sessions.map((session) => {
                  const status = session.attendance[0]?.status ?? null;
                  return (
                    <li
                      key={session.id}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {session.topic ?? "Session"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.classDate), "EEE, MMM d")}
                          {session.completedAt == null ? " · Upcoming" : ""}
                        </p>
                        {session.summary ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {session.summary}
                          </p>
                        ) : null}
                      </div>
                      {status ? (
                        <AttendanceStatusBadge status={status} />
                      ) : session.completedAt ? (
                        <span className="text-xs text-muted-foreground">
                          Not marked
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Weekly schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No weekly schedule set.
              </p>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between gap-3 bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-12 justify-center">
                        {DAY_SHORT[schedule.dayOfWeek]}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {DAY_LABELS[schedule.dayOfWeek]}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {minutesToTime(schedule.startMinutes)} –{" "}
                          {minutesToTime(schedule.endMinutes)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
