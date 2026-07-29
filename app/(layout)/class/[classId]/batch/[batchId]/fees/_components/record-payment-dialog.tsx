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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPaise } from "@/lib/currency";
import type { FeePeriod } from "@/lib/fee-periods";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { periodLabel, type RosterRow } from "./utils";

const METHOD_OPTIONS: { value: "CASH" | "OFFLINE_UPI"; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "OFFLINE_UPI", label: "Offline UPI" },
];

const schema = z.object({
  method: z.enum(["CASH", "OFFLINE_UPI"]),
  note: z.string().trim().max(500).optional(),
  paidAt: z.date({ message: "Pick a date" }),
});

type FormValues = z.infer<typeof schema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  period: FeePeriod;
  target: RosterRow | null;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  batchId,
  period,
  target,
}: RecordPaymentDialogProps) {
  const queryClient = useQueryClient();
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "CASH", note: "", paidAt: new Date() },
  });

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.fees.recordOfflinePayment.mutationOptions({
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

  if (!target) return null;

  // An abandoned online attempt that could still capture after this cash record.
  const pendingOnline =
    target.payment?.status === "PENDING" && target.payment.method === "ONLINE";

  function onSubmit(data: FormValues) {
    if (!target) return;
    toast.promise(
      mutateAsync({
        batchId,
        studentId: target.studentId,
        year: period.year,
        month: period.month,
        method: data.method,
        note: data.note?.trim() || undefined,
        paidAt: data.paidAt,
      }),
      {
        loading: "Recording payment...",
        success: "Payment recorded",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to record payment",
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a cash or offline-UPI payment of{" "}
            <span className="font-medium text-foreground">
              {formatPaise(target.amountPaise)}
            </span>{" "}
            from{" "}
            <span className="font-medium text-foreground">
              {target.fullName || target.email}
            </span>{" "}
            for {periodLabel(period)}.
          </DialogDescription>
        </DialogHeader>

        {pendingOnline && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            This student has an unfinished online payment for this month. If they
            complete it after you record cash here, the money still lands in
            Razorpay and this month will be marked for reconciliation. Check with
            them first.
          </p>
        )}

        <form id="record-payment-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="method"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="record-method">Method</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="record-method"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue>
                        {(value) =>
                          METHOD_OPTIONS.find((o) => o.value === value)?.label ??
                          "Select a method"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {METHOD_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
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
              name="paidAt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="record-date">Paid on</FieldLabel>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          id="record-date"
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
                        <span className="text-muted-foreground">Pick a date</span>
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
                        disabled={{ after: new Date() }}
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

            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="record-note">Note</FieldLabel>
                  <Textarea
                    {...field}
                    id="record-note"
                    aria-invalid={fieldState.invalid}
                    placeholder="Optional — e.g. paid in person"
                  />
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
          <Button type="submit" form="record-payment-form" disabled={isPending}>
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
