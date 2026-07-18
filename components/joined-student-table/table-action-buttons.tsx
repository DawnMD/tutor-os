"use client";

import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";

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
import { toast } from "sonner";

export const TableActionButton = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();

  const { mutateAsync: archieveStudent } = useMutation(
    orpc.owner.student.archieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getActiveStudentsByOrg.queryKey(),
        });
      },
    }),
  );

  const { mutateAsync: deleteStudent } = useMutation(
    orpc.owner.student.deleteStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getActiveStudentsByOrg.queryKey(),
        });
      },
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
          <DropdownMenuItem
            onClick={() =>
              toast.promise(archieveStudent({ studentId: id }), {
                loading: "Archieving",
                success: "Archieved",
                error: "Failed to archieve",
              })
            }
          >
            Archieve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              toast.promise(deleteStudent({ studentId: id }), {
                loading: "Deleting",
                success: "Deleted",
                error: "Failed to delete",
              })
            }
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
