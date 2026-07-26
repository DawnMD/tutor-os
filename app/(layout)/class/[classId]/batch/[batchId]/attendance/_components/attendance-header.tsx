"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, Download, Play } from "lucide-react";
import { toast } from "sonner";
import {
  AttendanceOverview,
  DAY_LABELS_SHORT,
  formatMinutes,
} from "./utils";

interface AttendanceHeaderProps {
  overview: AttendanceOverview;
  /** True when a session already exists for today. */
  hasTodaySession: boolean;
}

export function AttendanceHeader({
  overview,
  hasTodaySession,
}: AttendanceHeaderProps) {
  const queryClient = useQueryClient();

  const days = [...new Set(overview.schedules.map((s) => s.dayOfWeek))]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS_SHORT[d]);
  const primary = overview.schedules[0];

  const startMutation = useMutation(
    orpc.owner.batchSession.createSession.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.attendance.getAttendanceOverview.queryKey({
            input: { batchId: overview.id },
          }),
        });
      },
    }),
  );

  const startToday = () => {
    const today = new Date();
    toast.promise(
      startMutation.mutateAsync({
        batchId: overview.id,
        classDate: today,
        topic: `Class · ${format(today, "d MMM yyyy")}`,
      }),
      {
        loading: "Starting today's session...",
        success: "Today's session started",
        error: (err) =>
          err instanceof Error ? err.message : "Could not start session",
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {overview.class.name}
          </h1>
          <span className="text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl">
            {overview.name}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            {overview.students.length}{" "}
            {overview.students.length === 1 ? "student" : "students"}
          </span>
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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="sm" disabled>
                <Download className="size-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            }
          />
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
        {!hasTodaySession && (
          <Button
            size="sm"
            onClick={startToday}
            disabled={startMutation.isPending}
          >
            <Play className="size-4" />
            Start Today&apos;s Session
          </Button>
        )}
      </div>
    </div>
  );
}
