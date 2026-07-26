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
import { toast } from "sonner";
import { ExamRow, gradedCount } from "./utils";

interface DeleteExamDialogProps {
  exam: ExamRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  onDeleted: (examId: string) => void;
}

export function DeleteExamDialog({
  exam,
  open,
  onOpenChange,
  batchId,
  onDeleted,
}: DeleteExamDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.exam.deleteExam.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.exam.getExamsPage.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.exam.getExamsByBatch.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchDataById.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentDashboard.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.dashboard.getDashboardData.key(),
        });
      },
    }),
  );

  if (!exam) return null;

  const resultCount = gradedCount(exam);

  function onDelete() {
    if (!exam) return;
    const examId = exam.id;
    toast.promise(mutateAsync({ examId }), {
      loading: "Deleting exam...",
      success: "Exam deleted",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to delete exam",
    });
    onDeleted(examId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete exam</DialogTitle>
          <DialogDescription>
            Permanently delete{" "}
            <span className="font-medium text-foreground">{exam.title}</span>?
            This can&apos;t be undone.
            {resultCount > 0 && (
              <span className="mt-2 block text-destructive">
                This exam has recorded results for {resultCount}{" "}
                {resultCount === 1 ? "student" : "students"}. Deleting it
                permanently removes those marks.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={onDelete} disabled={isPending}>
            Delete exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
