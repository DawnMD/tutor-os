"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  students: z.array(z.string()),
});

export const AddStudent = ({
  batchName,
  batchId,
  disabled = false,
}: {
  batchName: string;
  batchId: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: students } = useQuery(
    orpc.owner.student.getAllStudents.queryOptions(),
  );

  const { mutateAsync: addStudentsToBatch } = useMutation(
    orpc.owner.batch.addStudent.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.owner.batch.getBatchDataById.queryKey({
              input: {
                batchId,
              },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.owner.batch.getBatchByOrg.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.owner.class.getAllClass.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.owner.student.getAllStudents.queryKey(),
          }),
        ]);
        setOpen(false);
      },
    }),
  );

  const studentsInBatch = useMemo(() => {
    return (
      students
        ?.filter((student) =>
          student.batches.some(({ batch }) => batch.id === batchId),
        )
        .map(({ id }) => id) ?? []
    );
  }, [batchId, students]);

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //resolver issue
    resolver: zodResolver(formSchema),
    defaultValues: {
      students: studentsInBatch,
    },
  });

  useEffect(() => {
    form.reset({
      students: studentsInBatch,
    });
  }, [studentsInBatch, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
    toast.promise(
      addStudentsToBatch({
        batchId: batchId,
        studentIds: data.students,
      }),
      {
        loading: "Saving changes...",
        success: "Saved",
        error: "Failed to save changes",
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        <UserPlus className="w-4 h-4" />
        <span>Modify Students</span>
      </DialogTrigger>
      <form id="add-student" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify students for {batchName}</DialogTitle>
            <DialogDescription>
              You can add or remove multiple students. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="students"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLegend variant="label">Students</FieldLegend>
                  <FieldGroup data-slot="checkbox-group">
                    {students?.map((student) => (
                      <Field
                        key={student.id}
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                      >
                        <Checkbox
                          id={`add-student-checkbox-${student.id}`}
                          name={field.name}
                          aria-invalid={fieldState.invalid}
                          checked={field.value.includes(student.id)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, student.id]
                                : field.value.filter((id) => id !== student.id),
                            );
                          }}
                        />
                        <FieldLabel
                          htmlFor={`add-student-checkbox-${student.id}`}
                          className="font-normal"
                        >
                          {student.fullName}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                </FieldSet>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" form="add-student">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
