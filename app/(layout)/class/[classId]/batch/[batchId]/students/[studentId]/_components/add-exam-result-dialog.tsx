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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  examId: z.string().min(1, "Select an exam."),
  marks: z.number().min(0, "Marks must be 0 or more."),
  remarks: z.string(),
});

interface AddExamResultDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  batchId: string;
  studentId: string;
}

export function AddExamResultDialog({
  open,
  setOpen,
  batchId,
  studentId,
}: AddExamResultDialogProps) {
  const queryClient = useQueryClient();

  const { data: exams } = useQuery(
    orpc.owner.exam.getExamsByBatch.queryOptions({
      input: { batchId },
      enabled: open,
    }),
  );

  const examLabels = Object.fromEntries(
    (exams ?? []).map((exam) => [
      exam.id,
      `${exam.title} — ${format(new Date(exam.examDate), "d MMM yyyy")}`,
    ]),
  );

  const { mutateAsync } = useMutation(
    orpc.owner.exam.upsertExamResult.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentDashboard.queryKey({
            input: { batchId, studentId },
          }),
        });
        // Keep the batch Exams page (aggregates + grading grid) in sync.
        queryClient.invalidateQueries({
          queryKey: orpc.owner.exam.getExamsPage.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.exam.getExamDetail.key(),
        });
        setOpen(false);
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //resolver issue
    resolver: zodResolver(formSchema),
    defaultValues: {
      examId: "",
      marks: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ examId: "", marks: 0, remarks: "" });
    }
  }, [open, form]);

  const selectedExamId = useWatch({ control: form.control, name: "examId" });
  const selectedExam = exams?.find((exam) => exam.id === selectedExamId);

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (selectedExam && data.marks > selectedExam.totalMarks) {
      form.setError("marks", {
        message: `Marks cannot exceed ${selectedExam.totalMarks}.`,
      });
      return;
    }

    toast.promise(
      mutateAsync({
        examId: data.examId,
        studentId,
        marks: data.marks,
        remarks: data.remarks || undefined,
      }),
      {
        loading: "Saving result...",
        success: "Result saved",
        error: "Failed to save result",
      },
    );
  }

  const hasExams = (exams?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <form id="add-exam-result" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add exam result</DialogTitle>
            <DialogDescription>
              Record this student&apos;s marks for an existing exam.
            </DialogDescription>
          </DialogHeader>
          {hasExams ? (
            <FieldGroup>
              <Controller
                name="examId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-exam-result-exam">Exam</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="add-exam-result-exam"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select an exam">
                          {(value) =>
                            examLabels[String(value)] ?? "Select an exam"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {exams?.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {`${exam.title} — ${format(
                              new Date(exam.examDate),
                              "d MMM yyyy",
                            )}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="marks"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-exam-result-marks">Marks</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="add-exam-result-marks"
                        type="number"
                        min={0}
                        max={selectedExam?.totalMarks}
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                      {selectedExam && (
                        <span className="text-sm text-muted-foreground">
                          / {selectedExam.totalMarks}
                        </span>
                      )}
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="remarks"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-exam-result-remarks">
                      Remarks
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="add-exam-result-remarks"
                      aria-invalid={fieldState.invalid}
                      placeholder="Optional note"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          ) : (
            <FieldGroup>
              <Field>
                <FieldDescription>
                  This batch has no exams yet. Create an exam for the batch
                  first, then record results here.
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              type="submit"
              form="add-exam-result"
              disabled={!hasExams || form.formState.isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
