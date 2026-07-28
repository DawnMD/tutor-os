"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resolveBatchColor } from "@/lib/batch-colors";
import {
  minutesToTime,
  type CalendarBatch,
  type CalendarEvent,
} from "@/lib/calendar-events";
import { isPastDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarOff,
  CalendarPlus,
  Repeat,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RescheduleDialog, type RescheduleMode } from "./reschedule-dialog";

interface DayActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: Date;
  events: CalendarEvent[];
  batches: CalendarBatch[];
}

function ColorDot({ colorId, batchId }: { colorId: string; batchId: string }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        resolveBatchColor(colorId, batchId).dot,
      )}
    />
  );
}

export function DayActionsDialog({
  open,
  onOpenChange,
  day,
  events,
  batches,
}: DayActionsDialogProps) {
  const queryClient = useQueryClient();
  const [holidayName, setHolidayName] = useState("");
  const [reschedule, setReschedule] = useState<RescheduleMode | null>(null);

  // Past days can still be opened (to undo a mistaken holiday/override) but
  // creation actions are disabled.
  const past = isPastDay(day);

  const holiday = events.find((e) => e.kind === "holiday");
  const scheduleChips = events.filter((e) => e.kind === "schedule");
  const overrideChips = events.filter((e) => e.kind === "override");
  const cancelledChips = events.filter((e) => e.kind === "cancelled");
  const hasDeliberate = events.some(
    (e) =>
      e.kind === "session" || e.kind === "override" || e.kind === "exam",
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: orpc.owner.batch.getCalendarData.key(),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.dashboard.getDashboardData.key(),
    });
  };

  const createHoliday = useMutation(
    orpc.owner.holiday.createHoliday.mutationOptions({
      onSuccess: () => {
        invalidate();
        onOpenChange(false);
      },
    }),
  );
  const deleteHoliday = useMutation(
    orpc.owner.holiday.deleteHoliday.mutationOptions({
      onSuccess: () => {
        invalidate();
        onOpenChange(false);
      },
    }),
  );
  const deleteOverride = useMutation(
    orpc.owner.scheduleOverride.deleteOverride.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  const busy =
    createHoliday.isPending ||
    deleteHoliday.isPending ||
    deleteOverride.isPending;

  function onMarkHoliday() {
    if (past) return;
    if (!holidayName.trim()) {
      toast.error("Add a holiday name");
      return;
    }
    toast.promise(
      createHoliday.mutateAsync({ date: day, name: holidayName.trim() }),
      {
        loading: "Marking holiday...",
        success: "Holiday marked",
        error: (err) =>
          err instanceof Error ? err.message : "Something went wrong",
      },
    );
  }

  function onRemoveHoliday(holidayId: string) {
    toast.promise(deleteHoliday.mutateAsync({ holidayId }), {
      loading: "Removing holiday...",
      success: "Holiday removed",
      error: (err) =>
        err instanceof Error ? err.message : "Something went wrong",
    });
  }

  function onDeleteOverride(overrideId: string, label: string) {
    toast.promise(deleteOverride.mutateAsync({ overrideId }), {
      loading: `${label}...`,
      success: "Done",
      error: (err) =>
        err instanceof Error ? err.message : "Something went wrong",
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{format(day, "EEEE, d MMMM yyyy")}</DialogTitle>
            <DialogDescription>
              Manage holidays and classes for this day.
            </DialogDescription>
          </DialogHeader>

          {past && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              This day is in the past — marking holidays, rescheduling and extra
              classes are disabled. You can still remove existing ones.
            </p>
          )}

          <div className="space-y-4">
            {/* Holiday section */}
            {holiday && holiday.kind === "holiday" ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-rose-300 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/40">
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarOff className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="truncate text-sm font-medium">
                    {holiday.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => onRemoveHoliday(holiday.holidayId)}
                >
                  Remove holiday
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Field>
                  <FieldLabel htmlFor="holiday-name">Mark as holiday</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="holiday-name"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="e.g. Diwali"
                      disabled={past}
                    />
                    <Button
                      variant="outline"
                      disabled={busy || past}
                      onClick={onMarkHoliday}
                    >
                      Confirm
                    </Button>
                  </div>
                </Field>
                {hasDeliberate && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    A holiday only hides recurring scheduled classes. Sessions,
                    exams and rescheduled/extra classes on this day will still
                    show.
                  </p>
                )}
              </div>
            )}

            {/* Reschedulable schedule chips */}
            {scheduleChips.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Scheduled classes
                </p>
                {scheduleChips.map((e, i) =>
                  e.kind === "schedule" ? (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-md border p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ColorDot colorId={e.colorId} batchId={e.batchId} />
                        <span className="truncate text-sm">
                          {e.className} · {e.batchName}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {minutesToTime(e.startMinutes)}–
                          {minutesToTime(e.endMinutes)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || past}
                        onClick={() =>
                          setReschedule({
                            kind: "MOVED",
                            batchId: e.batchId,
                            batchName: e.batchName,
                            className: e.className,
                            date: day,
                            defaultStartMinutes: e.startMinutes,
                            defaultEndMinutes: e.endMinutes,
                          })
                        }
                      >
                        <Repeat className="size-3.5" /> Reschedule
                      </Button>
                    </div>
                  ) : null,
                )}
              </div>
            )}

            {/* Override / cancelled chips → undo/remove */}
            {(overrideChips.length > 0 || cancelledChips.length > 0) && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Rescheduled &amp; extra classes
                </p>
                {overrideChips.map((e, i) =>
                  e.kind === "override" ? (
                    <div
                      key={`o-${i}`}
                      className="flex items-center justify-between gap-3 rounded-md border p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ColorDot colorId={e.colorId} batchId={e.batchId} />
                        <span className="truncate text-sm">
                          {e.className} · {e.batchName}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {minutesToTime(e.startMinutes)}–
                          {minutesToTime(e.endMinutes)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          onDeleteOverride(
                            e.overrideId,
                            e.overrideType === "MOVED"
                              ? "Undoing reschedule"
                              : "Removing extra class",
                          )
                        }
                      >
                        {e.overrideType === "MOVED"
                          ? "Undo reschedule"
                          : "Remove"}
                      </Button>
                    </div>
                  ) : null,
                )}
                {cancelledChips.map((e, i) =>
                  e.kind === "cancelled" ? (
                    <div
                      key={`c-${i}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-dashed p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <ColorDot colorId={e.colorId} batchId={e.batchId} />
                        <span className="truncate text-sm text-muted-foreground line-through">
                          {e.className} · {e.batchName}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {e.movedTo
                            ? `moved to ${format(e.movedTo, "MMM d")}`
                            : "cancelled"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          onDeleteOverride(e.overrideId, "Undoing reschedule")
                        }
                      >
                        Undo
                      </Button>
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              disabled={busy || past}
              onClick={() =>
                setReschedule({ kind: "EXTRA", batches, date: day })
              }
            >
              <CalendarPlus className="size-4" /> Add extra class
            </Button>
            <DialogClose render={<Button variant="ghost">Close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reschedule && (
        <RescheduleDialog
          key={`${reschedule.kind}-${day.toISOString()}`}
          open={reschedule != null}
          onOpenChange={(o) => {
            if (!o) setReschedule(null);
          }}
          mode={reschedule}
        />
      )}
    </>
  );
}
