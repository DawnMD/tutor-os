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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/orpc/client";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { ATTENDANCE_STATUS_STYLES } from "./utils";

const formSchema = z.object({
  sessionId: z.string().min(1, "Select a session."),
  status: z.enum(AttendanceStatus),
  remarks: z.string(),
});

interface MarkAttendanceDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  batchId: string;
  studentId: string;
}

export function MarkAttendanceDialog({
  open,
  setOpen,
  batchId,
  studentId,
}: MarkAttendanceDialogProps) {
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery(
    orpc.owner.batchSession.getSessionsByBatch.queryOptions({
      input: { batchId },
      enabled: open,
    }),
  );

  const sessionLabels = Object.fromEntries(
    (sessions ?? []).map((session) => [
      session.id,
      `${format(new Date(session.classDate), "d MMM yyyy")} — ${
        session.topic || "Untitled session"
      }`,
    ]),
  );

  const { mutateAsync } = useMutation(
    orpc.owner.attendance.markAttendance.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentDashboard.queryKey({
            input: { batchId, studentId },
          }),
        });
        setOpen(false);
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionId: "",
      status: AttendanceStatus.PRESENT,
      remarks: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        sessionId: "",
        status: AttendanceStatus.PRESENT,
        remarks: "",
      });
    }
  }, [open, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.promise(
      mutateAsync({
        sessionId: data.sessionId,
        studentId,
        status: data.status,
        remarks: data.remarks || undefined,
      }),
      {
        loading: "Marking attendance...",
        success: "Attendance marked",
        error: "Failed to mark attendance",
      },
    );
  }

  const hasSessions = (sessions?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <form id="mark-attendance" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark attendance</DialogTitle>
            <DialogDescription>
              Record this student&apos;s attendance for an existing session.
            </DialogDescription>
          </DialogHeader>
          {hasSessions ? (
            <FieldGroup>
              <Controller
                name="sessionId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="mark-attendance-session">
                      Session
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="mark-attendance-session"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select a session">
                          {(value) =>
                            sessionLabels[String(value)] ?? "Select a session"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {sessions?.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {`${format(
                              new Date(session.classDate),
                              "d MMM yyyy",
                            )} — ${session.topic || "Untitled session"}`}
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
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="mark-attendance-status">
                      Status
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="mark-attendance-status"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select a status">
                          {(value) =>
                            ATTENDANCE_STATUS_STYLES[
                              value as keyof typeof ATTENDANCE_STATUS_STYLES
                            ]?.label ?? "Select a status"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AttendanceStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {ATTENDANCE_STATUS_STYLES[status].label}
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
                name="remarks"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="mark-attendance-remarks">
                      Remarks
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="mark-attendance-remarks"
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
                  This batch has no sessions yet. Create a session from the
                  batch page first, then come back to mark attendance.
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              type="submit"
              form="mark-attendance"
              disabled={!hasSessions || form.formState.isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
