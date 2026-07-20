"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Outputs } from "@/orpc/router";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { BadgeCheck, Clock, Info, XCircle } from "lucide-react";
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

const ArchievedStudentTableActionButton = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();

  const { mutateAsync: restoreStudent } = useMutation(
    orpc.owner.student.unArchieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getActiveStudentsByOrg.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getArchieveStudentsByOrg.queryKey(),
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
              toast.promise(restoreStudent({ studentId: id }), {
                loading: "Restoreing student...",
                success: "Restored",
                error: "Failed to restore student",
              })
            }
          >
            Restore Student
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type ArchieveStudent =
  Outputs["owner"]["student"]["getArchieveStudentsByOrg"][number];

const columns: ColumnDef<ArchieveStudent>[] = [
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
    cell: ({ row }) => {
      const data = row.original;
      const formatted = data.batches.map((item) => item.name).join(", ");

      return <Badge variant={"outline"}>{formatted}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined At" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const formatted = format(data.createdAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "archievedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Archieved At" />
    ),
    cell: ({ row }) => {
      const data = row.original;

      if (!data.archievedAt) return null;

      const formatted = format(data.archievedAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "actions",
    cell: ({ row }) => {
      const userId = row.original.user_id;

      return <ArchievedStudentTableActionButton id={userId} />;
    },
  },
];

export const ArchievedStudentsTable = () => {
  const { data: pendingStudents, isLoading } = useQuery(
    orpc.owner.student.getArchieveStudentsByOrg.queryOptions(),
  );

  return (
    <DataTable data={pendingStudents} columns={columns} loading={isLoading} />
  );
};
