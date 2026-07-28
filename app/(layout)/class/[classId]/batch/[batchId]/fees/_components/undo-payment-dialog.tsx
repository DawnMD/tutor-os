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
import { formatPaise } from "@/lib/currency";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RosterRow } from "./utils";

interface UndoPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  target: RosterRow | null;
}

export function UndoPaymentDialog({
  open,
  onOpenChange,
  batchId,
  target,
}: UndoPaymentDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.fees.deleteOfflinePayment.mutationOptions({
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

  if (!target?.payment) return null;
  const paymentId = target.payment.id;

  function onUndo() {
    toast.promise(mutateAsync({ feePaymentId: paymentId }), {
      loading: "Undoing payment...",
      success: "Payment removed",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to undo payment",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Undo payment</DialogTitle>
          <DialogDescription>
            Remove the recorded{" "}
            <span className="font-medium text-foreground">
              {formatPaise(target.amountPaise)}
            </span>{" "}
            payment from{" "}
            <span className="font-medium text-foreground">
              {target.fullName || target.email}
            </span>
            ? This marks the month unpaid again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={onUndo} disabled={isPending}>
            Undo payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
