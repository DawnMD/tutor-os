"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Copy, Eye, NotebookPen, Pencil, Users } from "lucide-react";
import {
  getAttendanceSummary,
  getSessionStatus,
  isAttendancePending,
  relativeDayLabel,
  SESSION_STATUS_META,
  Session,
} from "./utils";

interface SessionCardProps {
  session: Session;
  totalStudents: number;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}

function AttendanceStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function SessionCard({
  session,
  totalStudents,
  onView,
  onEdit,
  onDuplicate,
}: SessionCardProps) {
  const status = getSessionStatus(session);
  const statusMeta = SESSION_STATUS_META[status];
  const summary = getAttendanceSummary(session);
  const pending = isAttendancePending(session);
  const date = new Date(session.classDate);

  return (
    <Card
      size="sm"
      className="cursor-pointer ring-1 ring-foreground/5 transition-colors hover:ring-foreground/15"
      onClick={onView}
    >
      <CardContent className="space-y-4">
        {/* Top row: date + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-semibold">{format(date, "d MMMM yyyy")}</p>
            <p className="text-xs text-muted-foreground">
              {format(date, "EEEE")} • {relativeDayLabel(date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {pending && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-amber-600 uppercase ring-1 ring-amber-500/20 dark:text-amber-400">
                Attendance pending
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase",
                statusMeta.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusMeta.dot)} />
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Topic */}
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
            Topic
          </p>
          <p className="text-base leading-snug font-medium">
            {session.topic || (
              <span className="text-muted-foreground italic">
                No topic recorded
              </span>
            )}
          </p>
        </div>

        {/* Attendance */}
        {summary.total > 0 ? (
          <div className="flex flex-wrap items-center gap-4 bg-muted/40 px-3 py-2">
            <AttendanceStat
              label="Present"
              value={summary.present}
              className="bg-emerald-500"
            />
            <AttendanceStat
              label="Absent"
              value={summary.absent}
              className="bg-rose-500"
            />
            <AttendanceStat
              label="Late"
              value={summary.late}
              className="bg-amber-500"
            />
            {summary.excused > 0 && (
              <AttendanceStat
                label="Excused"
                value={summary.excused}
                className="bg-slate-400"
              />
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {summary.total}/{totalStudents} marked
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            Attendance not marked yet
          </div>
        )}

        {/* Teacher summary */}
        {session.summary && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <NotebookPen className="mt-0.5 size-4 shrink-0" />
            <p className="line-clamp-2 leading-relaxed">{session.summary}</p>
          </div>
        )}
      </CardContent>

      {/* Footer actions */}
      <div
        className="flex items-center gap-1 border-t px-5 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="sm" onClick={onView}>
          <Eye className="size-4" />
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          <Copy className="size-4" />
          Duplicate
        </Button>
      </div>
    </Card>
  );
}
