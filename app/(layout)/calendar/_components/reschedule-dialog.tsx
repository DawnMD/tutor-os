"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { minutesToTime, type CalendarBatch } from "@/lib/calendar-events";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Batch identity the EXTRA-mode picker needs. */
type PickableBatch = Pick<CalendarBatch, "id" | "name" | "class">;

export type RescheduleMode =
  | {
      kind: "MOVED";
      batchId: string;
      batchName: string;
      className: string;
      /** Original occurrence date (fixed). */
      date: Date;
      defaultStartMinutes: number | null;
      defaultEndMinutes: number | null;
    }
  | {
      kind: "EXTRA";
      batches: PickableBatch[];
      /** Pre-selected class date (the clicked day). */
      date: Date;
    };

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: RescheduleMode;
}

function minutesToInput(m: number | null, fallback: string) {
  return m == null ? fallback : minutesToTime(m);
}

function inputToMinutes(v: string): number | null {
  const parts = v.split(":");
  if (parts.length !== 2) return null;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
  return hh * 60 + mm;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  mode,
}: RescheduleDialogProps) {
  const queryClient = useQueryClient();

  // The parent remounts this dialog (via `key`) on each open, so these lazy
  // initializers always run fresh from `mode`.
  const [batchId, setBatchId] = useState(() =>
    mode.kind === "EXTRA" ? "" : mode.batchId,
  );
  const [date, setDate] = useState<Date | undefined>(() => mode.date);
  const [dateOpen, setDateOpen] = useState(false);
  const [start, setStart] = useState(() =>
    mode.kind === "MOVED"
      ? minutesToInput(mode.defaultStartMinutes, "09:00")
      : "09:00",
  );
  const [end, setEnd] = useState(() =>
    mode.kind === "MOVED"
      ? minutesToInput(mode.defaultEndMinutes, "10:00")
      : "10:00",
  );
  const [reason, setReason] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: orpc.owner.batch.getCalendarData.key(),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.dashboard.getDashboardData.key(),
    });
    onOpenChange(false);
  };

  const createMutation = useMutation(
    orpc.owner.scheduleOverride.createOverride.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  const isMoved = mode.kind === "MOVED";
  const copy = isMoved
    ? {
        title: "Reschedule class",
        description: `Move this class to a new date and time. The original slot will show as cancelled.`,
        dateLabel: "New date",
        submit: "Reschedule",
        loading: "Rescheduling...",
        success: "Class rescheduled",
      }
    : {
        title: "Add extra class",
        description: "Schedule a one-off makeup or extra class for a batch.",
        dateLabel: "Class date",
        submit: "Add class",
        loading: "Adding class...",
        success: "Extra class added",
      };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode.kind === "EXTRA" && !batchId) {
      toast.error("Pick a batch");
      return;
    }
    if (!date) {
      toast.error("Pick a date");
      return;
    }
    const startMinutes = inputToMinutes(start);
    const endMinutes = inputToMinutes(end);
    if (startMinutes == null || endMinutes == null) {
      toast.error("Enter valid start and end times");
      return;
    }
    if (endMinutes <= startMinutes) {
      toast.error("End time must be after the start time");
      return;
    }

    const trimmedReason = reason.trim() || undefined;
    const promise =
      mode.kind === "MOVED"
        ? createMutation.mutateAsync({
            type: "MOVED",
            batchId: mode.batchId,
            date: mode.date,
            newDate: date,
            startMinutes,
            endMinutes,
            reason: trimmedReason,
          })
        : createMutation.mutateAsync({
            type: "EXTRA",
            batchId,
            date,
            startMinutes,
            endMinutes,
            reason: trimmedReason,
          });

    toast.promise(promise, {
      loading: copy.loading,
      success: copy.success,
      error: (err) => (err instanceof Error ? err.message : "Something went wrong"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form id="reschedule-form" onSubmit={onSubmit}>
          <FieldGroup>
            {mode.kind === "MOVED" ? (
              <Field>
                <FieldLabel>Class</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  {mode.className} · {mode.batchName} —{" "}
                  {format(mode.date, "EEE, d MMM yyyy")}
                </p>
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="reschedule-batch">Batch</FieldLabel>
                <Select
                  value={batchId}
                  onValueChange={(v) => setBatchId(v ?? "")}
                >
                  <SelectTrigger id="reschedule-batch" className="w-full">
                    <SelectValue placeholder="Select a batch">
                      {(value) => {
                        const b = mode.batches.find((x) => x.id === value);
                        return b
                          ? `${b.class.name} · ${b.name}`
                          : "Select a batch";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mode.batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {`${b.class.name} · ${b.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="reschedule-date">{copy.dateLabel}</FieldLabel>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="reschedule-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {date ? (
                    format(date, "d MMMM yyyy")
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setDateOpen(false);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="reschedule-start">Start time</FieldLabel>
                <Input
                  id="reschedule-start"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reschedule-end">End time</FieldLabel>
                <Input
                  id="reschedule-end"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="reschedule-reason">Reason</FieldLabel>
              <Textarea
                id="reschedule-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional note (e.g. makeup for public holiday)"
                rows={2}
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            type="submit"
            form="reschedule-form"
            disabled={createMutation.isPending}
          >
            {copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
