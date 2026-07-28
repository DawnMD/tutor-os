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
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { isPastDay, pastDayMatcher } from "@/lib/dates";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Session } from "./utils";

export type SessionFormMode =
  | { kind: "create"; date?: Date }
  | { kind: "duplicate"; source: Session }
  | { kind: "edit"; source: Session };

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  mode: SessionFormMode;
}

const COPY: Record<
  SessionFormMode["kind"],
  { title: string; description: string; submit: string; loading: string }
> = {
  create: {
    title: "Create session",
    description:
      "Log today's class or schedule an upcoming one — capture the date, topic and a quick summary. You can mark attendance afterwards.",
    submit: "Create session",
    loading: "Creating session...",
  },
  duplicate: {
    title: "Duplicate session",
    description:
      "Reuse this session's topic and summary for a new class date.",
    submit: "Create copy",
    loading: "Duplicating session...",
  },
  edit: {
    title: "Edit session",
    description: "Update the date, topic or summary for this class.",
    submit: "Save changes",
    loading: "Saving changes...",
  },
};

export function SessionFormDialog({
  open,
  onOpenChange,
  batchId,
  mode,
}: SessionFormDialogProps) {
  const queryClient = useQueryClient();
  // Editing a past session must still work: its original date stays allowed.
  const keepDate =
    mode.kind === "edit" ? new Date(mode.source.classDate) : undefined;
  // Initial values are derived from `mode`; the parent remounts this dialog on
  // each open (via `key`) so these lazy initializers always run fresh.
  const [classDate, setClassDate] = useState<Date | undefined>(() => {
    if (mode.kind === "create") {
      // A pre-seeded past date (e.g. from a dimmed cell) falls back to today.
      return mode.date != null && !isPastDay(mode.date) ? mode.date : new Date();
    }
    if (mode.kind === "edit") {
      return new Date(mode.source.classDate);
    }
    // Duplicate: start from today rather than the source's (possibly past) date.
    return new Date();
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [topic, setTopic] = useState(() =>
    mode.kind === "create" ? "" : (mode.source.topic ?? ""),
  );
  const [summary, setSummary] = useState(() =>
    mode.kind === "create" ? "" : (mode.source.summary ?? ""),
  );

  const invalidate = () => {
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
    onOpenChange(false);
  };

  const createMutation = useMutation(
    orpc.owner.batchSession.createSession.mutationOptions({
      onSuccess: invalidate,
    }),
  );
  const updateMutation = useMutation(
    orpc.owner.batchSession.updateSession.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  const copy = COPY[mode.kind];
  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classDate) {
      toast.error("Pick a class date");
      return;
    }
    if (
      isPastDay(classDate) &&
      !(keepDate != null && isSameDay(classDate, keepDate))
    ) {
      toast.error("Class date can't be in the past");
      return;
    }
    if (!topic.trim()) {
      toast.error("Add a session title");
      return;
    }
    const payload = {
      classDate,
      topic: topic.trim(),
      summary: summary.trim() || undefined,
    };
    const promise =
      mode.kind === "edit"
        ? updateMutation.mutateAsync({
            sessionId: mode.source.id,
            ...payload,
          })
        : createMutation.mutateAsync({ batchId, ...payload });

    toast.promise(promise, {
      loading: copy.loading,
      success:
        mode.kind === "edit" ? "Session updated" : "Session created",
      error: (err) =>
        err instanceof Error ? err.message : "Something went wrong",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form id="session-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="session-date">Class date</FieldLabel>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="session-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {classDate ? (
                    format(classDate, "d MMMM yyyy")
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={classDate}
                    onSelect={(date) => {
                      setClassDate(date);
                      setDateOpen(false);
                    }}
                    disabled={pastDayMatcher(keepDate)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field>
              <FieldLabel htmlFor="session-topic">
                Session title
                <span className="text-destructive"> *</span>
              </FieldLabel>
              <Input
                id="session-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Newton's Second Law"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="session-summary">Teacher summary</FieldLabel>
              <Textarea
                id="session-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What happened in class? Any observations for next time?"
                rows={4}
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="session-form" disabled={isPending}>
            {copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
