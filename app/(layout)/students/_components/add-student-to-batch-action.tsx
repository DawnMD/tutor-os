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
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Student } from "./columns";

const formSchema = z.object({
  batches: z.array(z.string()),
});

export const AddStudentToBatchAction = ({
  open,
  setOpen,
  student,
}: {
  student: Student;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { data: allBatches } = useQuery(
    orpc.owner.batch.getBatchByOrg.queryOptions(),
  );

  const queryClient = useQueryClient();

  const batches = student.batches.map((item) => item.batch.id);

  const { mutateAsync: addStudentToBatches } = useMutation(
    orpc.owner.student.addStudentToBatches.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getAllStudents.queryKey(),
        });
        setOpen(false);
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    //@ts-expect-error //resolver issue
    resolver: zodResolver(formSchema),
    defaultValues: {
      batches,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        batches,
      });
    }
  }, [open, batches, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (!student.studentId) return;

    toast.promise(
      addStudentToBatches({
        batchIds: data.batches,
        studentId: student.studentId,
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
      <form id="add-to-batches" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add student to batches</DialogTitle>
            <DialogDescription>
              You can add student to multiple batches. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="batches"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLegend variant="label">Batches</FieldLegend>
                  <FieldGroup data-slot="checkbox-group">
                    {allBatches?.map((batch) => (
                      <Field
                        key={batch.id}
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                      >
                        <Checkbox
                          id={`add-to-batches-checkbox-${batch.id}`}
                          name={field.name}
                          aria-invalid={fieldState.invalid}
                          checked={field.value.includes(batch.id)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, batch.id]
                                : field.value.filter((id) => id !== batch.id),
                            );
                          }}
                        />
                        <FieldLabel
                          htmlFor={`add-to-batches-checkbox-${batch.id}`}
                          className="font-normal"
                        >
                          {`${batch.class.name} | ${batch.name}`}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" form="add-to-batches">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};
