"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import {
  CheckCheck,
  CheckCircle2,
  Copy,
  Eraser,
  Lock,
  MessageSquare,
  Keyboard,
  RotateCcw,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusSegmented } from "./status-segmented";
import {
  AttendanceSession,
  AttendanceStudent,
  countStatuses,
  getInitials,
  SESSION_STATUS_META,
  sessionDisplayStatus,
  STATUS_META,
  STATUS_ORDER,
} from "./utils";

interface Draft {
  status: AttendanceStatus | null;
  remarks: string;
}

type DraftMap = Record<string, Draft>;

function buildDraft(session: AttendanceSession): DraftMap {
  const draft: DraftMap = {};
  for (const record of session.attendance) {
    draft[record.studentId] = {
      status: record.status,
      remarks: record.remarks ?? "",
    };
  }
  return draft;
}

function draftEquals(a: DraftMap, b: DraftMap, studentIds: string[]): boolean {
  return studentIds.every((id) => {
    const x = a[id];
    const y = b[id];
    return (
      (x?.status ?? null) === (y?.status ?? null) &&
      (x?.remarks ?? "") === (y?.remarks ?? "")
    );
  });
}

interface TodayAttendanceCardProps {
  batchId: string;
  session: AttendanceSession;
  previous: AttendanceSession | null;
  students: AttendanceStudent[];
}

/**
 * The primary marking surface. Holds a local draft of every student's status so
 * edits feel instant, then persists the whole sheet in one call. Remounted by
 * the parent (keyed on session id) whenever a different session is opened.
 */
export function TodayAttendanceCard({
  batchId,
  session,
  previous,
  students,
}: TodayAttendanceCardProps) {
  const queryClient = useQueryClient();
  const initial = useMemo(() => buildDraft(session), [session]);
  const [draft, setDraft] = useState<DraftMap>(() => buildDraft(session));
  const [remarksOpen, setRemarksOpen] = useState<Set<string>>(() => {
    // Reveal remarks fields that already have content.
    const open = new Set<string>();
    for (const record of session.attendance) {
      if (record.remarks) open.add(record.studentId);
    }
    return open;
  });

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  const counts = useMemo(
    () => countStatuses(studentIds.map((id) => draft[id]?.status ?? null)),
    [draft, studentIds],
  );

  const dirty = !draftEquals(draft, initial, studentIds);
  const completed = Boolean(session.completedAt);
  const status = sessionDisplayStatus(session);
  const statusMeta = SESSION_STATUS_META[status];
  const date = new Date(session.classDate);

  const saveMutation = useMutation(
    orpc.owner.attendance.markAttendanceBulk.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.attendance.getAttendanceOverview.queryKey({
            input: { batchId },
          }),
        });
      },
    }),
  );

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { status, remarks: prev[studentId]?.remarks ?? "" },
    }));
  };

  const setRemarks = (studentId: string, remarks: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { status: prev[studentId]?.status ?? null, remarks },
    }));
  };

  const markAllPresent = () => {
    setDraft((prev) => {
      const next: DraftMap = { ...prev };
      for (const id of studentIds) {
        next[id] = {
          status: AttendanceStatus.PRESENT,
          remarks: prev[id]?.remarks ?? "",
        };
      }
      return next;
    });
  };

  const clearAll = () => {
    setDraft((prev) => {
      const next: DraftMap = { ...prev };
      for (const id of studentIds) {
        next[id] = { status: null, remarks: "" };
      }
      return next;
    });
    setRemarksOpen(new Set());
  };

  const copyPrevious = () => {
    if (!previous) return;
    const source: DraftMap = {};
    for (const record of previous.attendance) {
      source[record.studentId] = {
        status: record.status,
        remarks: record.remarks ?? "",
      };
    }
    setDraft((prev) => {
      const next: DraftMap = { ...prev };
      for (const id of studentIds) {
        if (source[id]) {
          next[id] = {
            status: source[id].status,
            remarks: prev[id]?.remarks || source[id].remarks,
          };
        }
      }
      return next;
    });
    toast.success(
      `Copied attendance from ${format(new Date(previous.classDate), "d MMM")}`,
    );
  };

  const reset = () => {
    setDraft(buildDraft(session));
    const open = new Set<string>();
    for (const record of session.attendance) {
      if (record.remarks) open.add(record.studentId);
    }
    setRemarksOpen(open);
  };

  const toggleRemarks = (studentId: string) => {
    setRemarksOpen((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const focusRow = (index: number) => {
    const clamped = Math.max(0, Math.min(students.length - 1, index));
    rowRefs.current[clamped]?.focus();
  };

  const onRowKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number,
    studentId: string,
  ) => {
    // A completed session is read-only; ignore status shortcuts.
    if (completed) return;
    // Let the remarks input handle its own typing.
    if ((event.target as HTMLElement).tagName === "INPUT") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(index + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(index - 1);
      return;
    }
    const key = event.key.toLowerCase();
    const match = STATUS_ORDER.find((s) => STATUS_META[s].keys.includes(key));
    if (match) {
      event.preventDefault();
      setStatus(studentId, match);
      focusRow(index + 1);
    }
  };

  const persist = (complete?: boolean) => {
    const records = studentIds
      .filter((id) => draft[id]?.status)
      .map((id) => ({
        studentId: id,
        status: draft[id].status as AttendanceStatus,
        remarks: draft[id].remarks.trim() || undefined,
      }));

    if (records.length === 0) {
      toast.error("Mark at least one student before saving.");
      return;
    }

    toast.promise(
      saveMutation.mutateAsync({ sessionId: session.id, records, complete }),
      {
        loading: complete ? "Saving & completing..." : "Saving attendance...",
        success: complete
          ? "Attendance saved · session completed"
          : "Attendance saved",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to save attendance",
      },
    );
  };

  const reopen = () => {
    toast.promise(
      saveMutation.mutateAsync({
        sessionId: session.id,
        records: [],
        complete: false,
      }),
      {
        loading: "Reopening session...",
        success: "Session reopened for editing",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to reopen session",
      },
    );
  };

  const dateLabel = isToday(date)
    ? "Today's Session"
    : `Session · ${format(date, "d MMM")}`;

  return (
    <Card className="gap-0 overflow-visible py-0">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase",
                statusMeta.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusMeta.dot)} />
              {statusMeta.label}
            </span>
            {session.topic && (
              <span className="truncate text-xs text-muted-foreground">
                {session.topic}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {dateLabel}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(date, "EEEE, d MMMM yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {counts.marked}
              <span className="text-base font-medium text-muted-foreground">
                {" "}
                / {students.length}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">marked</p>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground sm:flex" />
              }
            >
              <Keyboard className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-56">
              <p className="font-medium">Keyboard shortcuts</p>
              <p className="text-xs">
                ↑ / ↓ or Tab to move · P / A / L / E to set status
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-5 py-3 sm:px-6">
        <Button
          variant="outline"
          size="sm"
          onClick={markAllPresent}
          disabled={completed}
        >
          <CheckCheck className="size-4" />
          Mark all present
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyPrevious}
          disabled={!previous || completed}
        >
          <Copy className="size-4" />
          Copy previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={counts.marked === 0 || completed}
        >
          <Eraser className="size-4" />
          Clear
        </Button>
        <div className="ml-auto hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className={cn("size-1.5 rounded-full", STATUS_META[s].dot)}
              />
              <span className="tabular-nums">
                {s === AttendanceStatus.PRESENT
                  ? counts.present
                  : s === AttendanceStatus.ABSENT
                    ? counts.absent
                    : s === AttendanceStatus.LATE
                      ? counts.late
                      : counts.excused}
              </span>
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Student list */}
      <CardContent className="p-0">
        <ul className="divide-y">
          {students.map((student, index) => {
            const entry = draft[student.id];
            const remarksVisible = remarksOpen.has(student.id);
            return (
              <li key={student.id}>
                <div
                  ref={(el) => {
                    rowRefs.current[index] = el;
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => onRowKeyDown(e, index, student.id)}
                  className={cn(
                    "flex flex-col gap-3 px-5 py-3 outline-none transition-colors sm:flex-row sm:items-center sm:px-6",
                    "focus-visible:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
                    "hover:bg-muted/40",
                  )}
                >
                  {/* Identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <Avatar size="sm">
                      <AvatarFallback>
                        {getInitials(student.fullName, student.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {student.fullName || "Unnamed student"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Status + remarks toggle */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <StatusSegmented
                      value={entry?.status ?? null}
                      onChange={(s) => setStatus(student.id, s)}
                      size="sm"
                      disabled={completed}
                      className="flex-1 sm:flex-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      tabIndex={-1}
                      aria-label="Add remark"
                      disabled={completed}
                      onClick={() => toggleRemarks(student.id)}
                      className={cn(
                        "size-8 shrink-0",
                        (remarksVisible || entry?.remarks) && "text-foreground",
                      )}
                    >
                      <MessageSquare className="size-4" />
                    </Button>
                  </div>
                </div>

                {remarksVisible && (
                  <div className="px-5 pb-3 sm:pl-17 sm:pr-6">
                    <InputGroup className="h-8">
                      <InputGroupAddon>
                        <MessageSquare className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={entry?.remarks ?? ""}
                        onChange={(e) => setRemarks(student.id, e.target.value)}
                        readOnly={completed}
                        placeholder="Add a remark (optional)"
                      />
                    </InputGroup>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {students.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No active students in this batch yet.
          </p>
        )}
      </CardContent>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t bg-card/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5 md:static md:bg-card md:backdrop-blur-none">
        <p className="text-xs text-muted-foreground">
          {completed ? (
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              Completed &amp; locked — reopen to make changes
            </span>
          ) : dirty ? (
            <span className="text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          ) : (
            "All changes saved"
          )}
        </p>
        {completed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={reopen}
            disabled={saveMutation.isPending}
          >
            <RotateCcw className="size-4" />
            Reopen to edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={!dirty || saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => persist()}
              disabled={saveMutation.isPending}
            >
              Save
            </Button>
            <Button
              size="sm"
              onClick={() => persist(true)}
              disabled={saveMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              Save &amp; Complete
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
