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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { StudentDashboard } from "./utils";

const formSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
});

interface EditStudentDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  student: StudentDashboard;
  batchId: string;
  studentId: string;
}

export function EditStudentDialog({
  open,
  setOpen,
  student,
  batchId,
  studentId,
}: EditStudentDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation(
    orpc.owner.student.updateStudent.mutationOptions({
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
      fullName: student.fullName ?? "",
      phone: student.phone ?? "",
      guardianName: student.guardianName ?? "",
      guardianPhone: student.guardianPhone ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: student.fullName ?? "",
        phone: student.phone ?? "",
        guardianName: student.guardianName ?? "",
        guardianPhone: student.guardianPhone ?? "",
      });
    }
  }, [open, student, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.promise(
      mutateAsync({
        studentId,
        fullName: data.fullName,
        phone: data.phone,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
      }),
      {
        loading: "Saving changes...",
        success: "Student updated",
        error: "Failed to update student",
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <form id="edit-student" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>
              Update this student&apos;s contact details. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-student-fullName">
                    Full name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-student-fullName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Jane Doe"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="edit-student-email">Email</FieldLabel>
              <Input
                id="edit-student-email"
                value={student.email}
                readOnly
                disabled
              />
            </Field>

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-student-phone">Phone</FieldLabel>
                  <Input
                    {...field}
                    id="edit-student-phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="+1 555 000 0000"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="guardianName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-student-guardianName">
                    Guardian name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-student-guardianName"
                    aria-invalid={fieldState.invalid}
                    placeholder="John Doe"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="guardianPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-student-guardianPhone">
                    Guardian phone
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-student-guardianPhone"
                    aria-invalid={fieldState.invalid}
                    placeholder="+1 555 000 0000"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              type="submit"
              form="edit-student"
              disabled={form.formState.isSubmitting}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
