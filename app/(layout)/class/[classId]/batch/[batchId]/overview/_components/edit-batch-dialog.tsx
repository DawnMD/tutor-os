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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BATCH_COLOR_IDS, BATCH_COLORS } from "@/lib/batch-colors";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { Outputs } from "@/orpc/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Batch name is required"),
  color: z.enum(BATCH_COLOR_IDS),
});

type FormValues = z.infer<typeof formSchema>;

interface EditBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: NonNullable<Outputs["owner"]["batch"]["getBatchDataById"]>;
}

export function EditBatchDialog({
  open,
  onOpenChange,
  batch,
}: EditBatchDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    // @ts-expect-error zodResolver output/input mismatch on the color enum
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: batch.name,
      color: BATCH_COLOR_IDS.includes(batch.color ?? "")
        ? (batch.color as string)
        : BATCH_COLOR_IDS[0],
    },
  });

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.batch.updateBatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchDataById.queryKey({
            input: { batchId: batch.id },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchByOrg.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getCalendarData.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.class.getAllClass.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.dashboard.getDashboardData.key(),
        });
        onOpenChange(false);
      },
    }),
  );

  function onSubmit(data: FormValues) {
    toast.promise(
      mutateAsync({
        batchId: batch.id,
        name: data.name.trim(),
        color: data.color,
      }),
      {
        loading: "Saving changes...",
        success: "Batch updated",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to update batch",
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit batch</DialogTitle>
          <DialogDescription>
            Update the name and color for this batch.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-batch-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-batch-name">Batch name</FieldLabel>
                  <Input
                    {...field}
                    id="edit-batch-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Class 12 Batch"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="color"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <RadioGroup
                    aria-label="Batch color"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    className="flex flex-wrap gap-2"
                  >
                    {BATCH_COLORS.map((color) => (
                      <RadioGroupItem
                        key={color.id}
                        value={color.id}
                        aria-label={color.label}
                        className={cn(
                          "size-6 border-transparent transition-transform data-checked:scale-110 data-checked:ring-2 data-checked:ring-ring data-checked:ring-offset-2 data-checked:ring-offset-background",
                          color.swatch,
                        )}
                      />
                    ))}
                  </RadioGroup>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="edit-batch-form" disabled={isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
