"use client";

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
import { useState } from "react";
import { toast } from "sonner";
import { AddStudentToBatchAction } from "./add-student-to-batch-action";
import { Student } from "./columns";

export const TableActionsMenu = ({ student }: { student: Student }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutateAsync: archieveStudent } = useMutation(
    orpc.owner.student.archieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getAllStudents.queryKey(),
        });
      },
    }),
  );

  const { mutateAsync: restoreStudent } = useMutation(
    orpc.owner.student.unArchieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getAllStudents.queryKey(),
        });
      },
    }),
  );

  return (
    <>
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
                  toast.promise(
                    archieveStudent({ studentId: student.clerkUserId }),
                    {
                      loading: "Archieving",
                      success: "Archieved",
                      error: "Failed to archieve",
                    },
                  );
                }}
              >
                Archieve
              </DropdownMenuItem>
            )}
            {!!student.archivedAt && (
              <DropdownMenuItem
                onClick={() => {
                  toast.promise(
                    restoreStudent({ studentId: student.clerkUserId }),
                    {
                      loading: "Restoreing student...",
                      success: "Restored",
                      error: "Failed to restore student",
                    },
                  );
                }}
              >
                Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setOpen(true)}>
              Add To Batch
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddStudentToBatchAction
        open={open}
        setOpen={setOpen}
        student={student}
      />
    </>
  );
};
