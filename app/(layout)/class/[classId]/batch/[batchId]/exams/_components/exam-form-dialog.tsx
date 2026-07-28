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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isPastDay, pastDayMatcher } from "@/lib/dates";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { ExamRow } from "./utils";

export type ExamFormMode =
  | { kind: "create" }
  | { kind: "edit"; source: ExamRow };

// Factory so the past-date refinement can exempt an edit dialog's original
// date (`keepDate`) — editing yesterday's exam must still save.
function buildFormSchema(keepDate?: Date) {
  return z.object({
    title: z.string().trim().min(1, "Exam title is required"),
    totalMarks: z
      .number({ message: "Total marks is required" })
      .int("Total marks must be a whole number")
      .min(1, "Total marks must be at least 1"),
    examDate: z
      .date({ message: "Pick an exam date" })
      .refine(
        (d) => !isPastDay(d) || (keepDate != null && isSameDay(d, keepDate)),
        { message: "Exam date can't be in the past" },
      ),
  });
}

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

interface ExamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  mode: ExamFormMode;
}

const COPY: Record<
  ExamFormMode["kind"],
  {
    title: string;
    description: string;
    submit: string;
    loading: string;
    done: string;
  }
> = {
  create: {
    title: "Create exam",
    description:
      "Schedule an exam for this batch — set a title, total marks and the date. You can record marks afterwards.",
    submit: "Create exam",
    loading: "Creating exam...",
    done: "Exam created",
  },
  edit: {
    title: "Edit exam",
    description: "Update the title, total marks or date for this exam.",
    submit: "Save changes",
    loading: "Saving changes...",
    done: "Exam updated",
  },
};

export function ExamFormDialog({
  open,
  onOpenChange,
  batchId,
  mode,
}: ExamFormDialogProps) {
  const queryClient = useQueryClient();
  const [dateOpen, setDateOpen] = useState(false);

  // The dialog remounts per open (parent `key`), so deriving this once is safe.
  const keepDate =
    mode.kind === "edit" ? new Date(mode.source.examDate) : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(buildFormSchema(keepDate)),
    defaultValues: {
      title: mode.kind === "edit" ? mode.source.title : "",
      totalMarks: mode.kind === "edit" ? mode.source.totalMarks : 100,
      examDate:
        mode.kind === "edit" ? new Date(mode.source.examDate) : new Date(),
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: orpc.owner.exam.getExamsPage.queryKey({ input: { batchId } }),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.exam.getExamsByBatch.queryKey({
        input: { batchId },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.batch.getBatchDataById.queryKey({
        input: { batchId },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.dashboard.getDashboardData.key(),
    });
    if (mode.kind === "edit") {
      queryClient.invalidateQueries({
        queryKey: orpc.owner.exam.getExamDetail.queryKey({
          input: { examId: mode.source.id },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.owner.batchStudent.getStudentDashboard.key(),
      });
    }
    onOpenChange(false);
  };

  const createMutation = useMutation(
    orpc.owner.exam.createExam.mutationOptions({ onSuccess: invalidate }),
  );
  const updateMutation = useMutation(
    orpc.owner.exam.updateExam.mutationOptions({ onSuccess: invalidate }),
  );

  const copy = COPY[mode.kind];
  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(data: FormValues) {
    const payload = {
      title: data.title.trim(),
      totalMarks: data.totalMarks,
      examDate: data.examDate,
    };
    const promise =
      mode.kind === "edit"
        ? updateMutation.mutateAsync({ examId: mode.source.id, ...payload })
        : createMutation.mutateAsync({ batchId, ...payload });

    toast.promise(promise, {
      loading: copy.loading,
      success: copy.done,
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
        <form id="exam-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="exam-title">
                    Exam title
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="exam-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Unit Test 1"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="totalMarks"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="exam-total">
                    Total marks
                    <span className="text-destructive"> *</span>
                  </FieldLabel>
                  <Input
                    id="exam-total"
                    type="number"
                    min={1}
                    aria-invalid={fieldState.invalid}
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="examDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="exam-date">Exam date</FieldLabel>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          id="exam-date"
                          type="button"
                          variant="outline"
                          className="w-full justify-start font-normal"
                          aria-invalid={fieldState.invalid}
                        />
                      }
                    >
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      {field.value ? (
                        format(field.value, "d MMMM yyyy")
                      ) : (
                        <span className="text-muted-foreground">
                          Pick a date
                        </span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) field.onChange(date);
                          setDateOpen(false);
                        }}
                        disabled={pastDayMatcher(keepDate)}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="exam-form" disabled={isPending}>
            {copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
