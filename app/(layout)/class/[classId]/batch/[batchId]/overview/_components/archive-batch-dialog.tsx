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
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ArchiveBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchName: string;
}

export function ArchiveBatchDialog({
  open,
  onOpenChange,
  batchId,
  batchName,
}: ArchiveBatchDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.batch.archieveBatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchDataById.queryKey({
            input: { batchId },
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
        router.push("/class");
      },
    }),
  );

  function onArchive() {
    toast.promise(mutateAsync({ batchId }), {
      loading: "Archiving batch...",
      success: "Batch archived",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to archive batch",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive batch</DialogTitle>
          <DialogDescription>
            Archive{" "}
            <span className="font-medium text-foreground">{batchName}</span>? It
            will be hidden from active views and removed from the calendar. You
            can unarchive it later from the batch overview.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={onArchive} disabled={isPending}>
            Archive batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
