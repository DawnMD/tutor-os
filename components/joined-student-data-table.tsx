"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
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
import { Outputs } from "@/orpc/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

type Student = Outputs["owner"]["student"]["getActiveStudentsByOrg"][number];

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "batches",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Batches" />
    ),
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined At" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const formatted = format(data.joinedAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "actions",
    cell: ({ row }) => {
      const id = row.original.id;

      return <JoinedStudentTableActionButton id={id} />;
    },
  },
];

const JoinedStudentTableActionButton = ({ id }: { id: string }) => {
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

export const JoinedStudentsTable = () => {
  const { data: joinedStudents } = useQuery(
    orpc.owner.student.getActiveStudentsByOrg.queryOptions(),
  );

  if (!joinedStudents) {
    return null;
  }

  return <DataTable data={joinedStudents} columns={columns} />;
};
