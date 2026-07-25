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
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { StudentDashboard } from "./utils";

interface ArchiveStudentDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  student: StudentDashboard;
  classId: string;
  batchId: string;
  studentId: string;
}

export function ArchiveStudentDialog({
  open,
  setOpen,
  student,
  classId,
  batchId,
  studentId,
}: ArchiveStudentDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation(
    orpc.owner.student.archieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentsByBatch.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getAllStudents.queryKey(),
        });
        setOpen(false);
        router.push(`/class/${classId}/batch/${batchId}/students`);
      },
    }),
  );

  function onArchive() {
    toast.promise(mutateAsync({ studentId }), {
      loading: "Archiving student...",
      success: "Student archived",
      error: "Failed to archive student",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive student</DialogTitle>
          <DialogDescription>
            Archive{" "}
            <span className="font-medium text-foreground">
              {student.fullName ?? student.email}
            </span>
            ? They will be removed from active rosters. You can restore them
            later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={onArchive}>
            Archive student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
