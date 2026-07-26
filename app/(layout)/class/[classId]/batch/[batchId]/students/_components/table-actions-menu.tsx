"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Student } from "./columns";

export const TableActionsMenu = ({ student }: { student: Student }) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    // archivedAt is global to the student, so refresh every batch's roster
    // and overview (partial keys match across all batches), plus the
    // global students list.
    queryClient.invalidateQueries({
      queryKey: orpc.owner.batchStudent.getStudentsByBatch.key(),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.batch.getBatchDataById.key(),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.owner.student.getAllStudents.queryKey(),
    });
  };

  const { mutateAsync: archieveStudent } = useMutation(
    orpc.owner.student.archieveStudent.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  const { mutateAsync: restoreStudent } = useMutation(
    orpc.owner.student.unArchieveStudent.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-8 w-8 p-0" />}
      >
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!student.archivedAt && (
            <DropdownMenuItem
              onClick={() => {
                toast.promise(archieveStudent({ studentId: student.id }), {
                  loading: "Archiving student...",
                  success: "Student archived",
                  error: "Failed to archive student",
                });
              }}
            >
              Archive
            </DropdownMenuItem>
          )}
          {!!student.archivedAt && (
            <DropdownMenuItem
              onClick={() => {
                toast.promise(restoreStudent({ studentId: student.id }), {
                  loading: "Restoring student...",
                  success: "Student restored",
                  error: "Failed to restore student",
                });
              }}
            >
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
