"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BookMarked,
  CalendarClock,
  CheckCircle2,
  Clock,
  ImageIcon,
  NotebookPen,
  Paperclip,
  PencilLine,
  RotateCcw,
  Timer,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatMinutes,
  getAttendanceSummary,
  getSessionStatus,
  isSessionCompletable,
  SESSION_STATUS_META,
  Session,
  SessionSchedule,
} from "./utils";

interface SessionDetailDrawerProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  schedules: SessionSchedule[];
  totalStudents: number;
  onEdit: (session: Session) => void;
  onViewAttendance: (session: Session) => void;
}

const STATUS_ROWS: {
  key: keyof ReturnType<typeof getAttendanceSummary>;
  label: string;
  dot: string;
}[] = [
  { key: "present", label: "Present", dot: "bg-emerald-500" },
  { key: "absent", label: "Absent", dot: "bg-rose-500" },
  { key: "late", label: "Late", dot: "bg-amber-500" },
  { key: "excused", label: "Excused", dot: "bg-slate-400" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function OverviewRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export function SessionDetailDrawer({
  session,
  open,
  onOpenChange,
  batchId,
  schedules,
  totalStudents,
  onEdit,
  onViewAttendance,
}: SessionDetailDrawerProps) {
  const queryClient = useQueryClient();
  const completeMutation = useMutation(
    orpc.owner.batchSession.completeSession.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchSession.getSessionsPage.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchSession.getSessionsByBatch.queryKey({
            input: { batchId },
          }),
        });
      },
    }),
  );

  if (!session) return null;

  const date = new Date(session.classDate);
  const status = getSessionStatus(session);
  const statusMeta = SESSION_STATUS_META[status];
  const summary = getAttendanceSummary(session);

  const daySchedule = schedules.find((s) => s.dayOfWeek === date.getDay());
  const durationLabel = daySchedule
    ? (() => {
        const mins = daySchedule.endMinutes - daySchedule.startMinutes;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h ? `${h}h ` : ""}${m ? `${m}m` : ""}`.trim();
      })()
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full! gap-0 p-0 sm:w-120! sm:max-w-none!"
      >
        <SheetHeader className="gap-2 border-b p-6">
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
          </div>
          <SheetTitle className="normal-case tracking-normal">
            {session.topic || "Untitled session"}
          </SheetTitle>
          <SheetDescription>
            {format(date, "EEEE, d MMMM yyyy")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Overview */}
          <section className="space-y-3">
            <SectionLabel>Overview</SectionLabel>
            <OverviewRow icon={CalendarClock} label="Date">
              {format(date, "d MMMM yyyy")}
            </OverviewRow>
            <OverviewRow icon={Timer} label="Duration">
              {durationLabel ? (
                <>
                  {durationLabel}
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatMinutes(daySchedule!.startMinutes)} –{" "}
                    {formatMinutes(daySchedule!.endMinutes)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Not scheduled</span>
              )}
            </OverviewRow>
            <OverviewRow icon={BookMarked} label="Topic">
              {session.topic || (
                <span className="text-muted-foreground">No topic recorded</span>
              )}
            </OverviewRow>
            <OverviewRow icon={NotebookPen} label="Teacher summary">
              {session.summary || (
                <span className="text-muted-foreground">
                  No summary added for this class.
                </span>
              )}
            </OverviewRow>
            <OverviewRow icon={PencilLine} label="Homework">
              <span className="text-muted-foreground">
                No homework recorded yet.
              </span>
            </OverviewRow>
          </section>

          <Separator />

          {/* Attendance */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Attendance</SectionLabel>
              <span className="text-xs text-muted-foreground">
                {summary.total}/{totalStudents} marked
              </span>
            </div>
            {summary.total > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ROWS.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span className={cn("size-2 rounded-full", row.dot)} />
                      {row.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {summary[row.key]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                <Users className="size-4" />
                Attendance has not been marked for this session.
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onViewAttendance(session)}
            >
              <CheckCircle2 className="size-4" />
              View Attendance
            </Button>
          </section>

          <Separator />

          {/* Attachments (future) */}
          <section className="space-y-3">
            <SectionLabel>Attachments</SectionLabel>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center">
              <div className="flex gap-2 text-muted-foreground">
                <ImageIcon className="size-5" />
                <Paperclip className="size-5" />
              </div>
              <p className="text-sm font-medium">No attachments yet</p>
              <p className="text-xs text-muted-foreground">
                Whiteboard photos, PDFs and worksheets will appear here.
              </p>
            </div>
          </section>

          <Separator />

          {/* Activity */}
          <section className="space-y-3">
            <SectionLabel>Activity</SectionLabel>
            <ol className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created</span>
                <span className="ml-auto">
                  {format(new Date(session.createdAt), "d MMM yyyy, h:mm a")}
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <PencilLine className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last updated</span>
                <span className="ml-auto">
                  {format(new Date(session.createdAt), "d MMM yyyy, h:mm a")}
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <CheckCircle2
                  className={cn(
                    "size-4",
                    session.completedAt
                      ? "text-emerald-500"
                      : "text-muted-foreground/40",
                  )}
                />
                <span className="text-muted-foreground">Completed</span>
                <span className="ml-auto">
                  {session.completedAt ? (
                    format(new Date(session.completedAt), "d MMM yyyy, h:mm a")
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </li>
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t p-4">
          {session.completedAt ? (
            <Button
              variant="outline"
              onClick={() => {
                toast.promise(
                  completeMutation.mutateAsync({
                    sessionId: session.id,
                    completed: false,
                  }),
                  {
                    loading: "Reopening session...",
                    success: "Session reopened",
                    error: (err) =>
                      err instanceof Error
                        ? err.message
                        : "Something went wrong",
                  },
                );
              }}
              disabled={completeMutation.isPending}
            >
              <RotateCcw className="size-4" />
              Reopen session
            </Button>
          ) : (
            isSessionCompletable(session) && (
              <Button
                onClick={() => {
                  toast.promise(
                    completeMutation.mutateAsync({
                      sessionId: session.id,
                      completed: true,
                    }),
                    {
                      loading: "Completing session...",
                      success: "Session marked as complete",
                      error: (err) =>
                        err instanceof Error
                          ? err.message
                          : "Something went wrong",
                    },
                  );
                }}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="size-4" />
                Complete session
              </Button>
            )
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(session)}
            >
              <PencilLine className="size-4" />
              Edit session
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
