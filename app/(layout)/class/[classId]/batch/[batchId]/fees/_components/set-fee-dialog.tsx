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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { paiseToRupees, rupeesToPaise } from "@/lib/currency";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const schema = z.object({
  // NaN when the input is empty — treated as "disable fees" on submit.
  feeRupees: z
    .number({ message: "Enter an amount" })
    .min(0, "Fee can't be negative")
    .max(10_000_000, "That fee looks too large")
    .or(z.nan()),
});

type FormValues = z.infer<typeof schema>;

interface SetFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  currentFeePaise: number | null;
}

export function SetFeeDialog({
  open,
  onOpenChange,
  batchId,
  currentFeePaise,
}: SetFeeDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      feeRupees:
        currentFeePaise != null ? paiseToRupees(currentFeePaise) : NaN,
    },
  });

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.fees.setBatchFee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.fees.getBatchFeesPage.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.fees.listBatchPayments.queryKey({
            input: { batchId },
          }),
        });
        onOpenChange(false);
      },
    }),
  );

  function submit(monthlyFeePaise: number | null, verb: string) {
    toast.promise(mutateAsync({ batchId, monthlyFeePaise }), {
      loading: `${verb}...`,
      success:
        monthlyFeePaise == null ? "Fees disabled" : "Monthly fee saved",
      error: (err) =>
        err instanceof Error ? err.message : "Something went wrong",
    });
  }

  const onSubmit = (data: FormValues) => {
    const monthlyFeePaise = Number.isNaN(data.feeRupees)
      ? null
      : rupeesToPaise(data.feeRupees);
    submit(monthlyFeePaise, monthlyFeePaise == null ? "Disabling fees" : "Saving fee");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Monthly fee</DialogTitle>
          <DialogDescription>
            Every enrolled student owes this amount each month, from the month
            they joined. Changing it updates all unpaid months; already-paid
            months keep what was charged.
          </DialogDescription>
        </DialogHeader>
        <form id="set-fee-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="feeRupees"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="fee-amount">Amount (₹)</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>₹</InputGroupAddon>
                    <InputGroupInput
                      id="fee-amount"
                      type="number"
                      min={0}
                      step="1"
                      inputMode="numeric"
                      placeholder="e.g. 1500"
                      aria-invalid={fieldState.invalid}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </InputGroup>
                  <FieldDescription>
                    Leave empty to disable fees for this batch.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter className="sm:justify-between">
          {currentFeePaise != null ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              disabled={isPending}
              onClick={() => submit(null, "Disabling fees")}
            >
              Disable fees
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" form="set-fee-form" disabled={isPending}>
              Save fee
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
