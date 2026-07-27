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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  toBatchId: z.string().min(1, "Select a batch to move the student to."),
});

interface MoveBatchDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  batchId: string;
  studentId: string;
}

export function MoveBatchDialog({
  open,
  setOpen,
  batchId,
  studentId,
}: MoveBatchDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: allBatches } = useQuery(
    orpc.owner.batch.getBatchByOrg.queryOptions(),
  );

  const otherBatches = (allBatches ?? []).filter(
    (batch) => batch.id !== batchId,
  );

  const batchLabels = Object.fromEntries(
    otherBatches.map((batch) => [
      batch.id,
      `${batch.class.name} | ${batch.name}`,
    ]),
  );

  const { mutateAsync } = useMutation(
    orpc.owner.student.moveStudentToBatch.mutationOptions({
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentsByBatch.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchByOrg.queryKey(),
        });
        setOpen(false);
        router.push(
          `/class/${result.classId}/batch/${variables.toBatchId}/students/${studentId}`,
        );
      },
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toBatchId: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ toBatchId: "" });
    }
  }, [open, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.promise(
      mutateAsync({
        studentId,
        fromBatchId: batchId,
        toBatchId: data.toBatchId,
      }),
      {
        loading: "Moving student...",
        success: "Student moved",
        error: "Failed to move student",
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <form id="move-batch" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to another batch</DialogTitle>
            <DialogDescription>
              The student will be removed from the current batch and added to
              the selected one.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="toBatchId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="move-batch-target">Batch</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="move-batch-target"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select a batch">
                        {(value) =>
                          batchLabels[String(value)] ?? "Select a batch"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {otherBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {`${batch.class.name} | ${batch.name}`}
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
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              type="submit"
              form="move-batch"
              disabled={form.formState.isSubmitting}
            >
              Move student
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
