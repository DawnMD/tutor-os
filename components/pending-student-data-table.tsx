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

const PendingStudentTableActionButton = ({
  id,
  status,
}: {
  id: string;
  status: PendingStudent["status"];
}) => {
  const queryClient = useQueryClient();

  const { mutateAsync: revokeInvite } = useMutation(
    orpc.owner.student.revokeInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getPendingStudentsByOrg.queryKey(),
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
            disabled={status !== "pending"}
            onClick={() =>
              toast.promise(revokeInvite({ invitationId: id }), {
                loading: "Revoking invitation",
                success: "Revoked",
                error: "Failed to revoke invitation",
              })
            }
          >
            Revoke Invitation
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type PendingStudent =
  Outputs["owner"]["student"]["getPendingStudentsByOrg"][number];

const columns: ColumnDef<PendingStudent>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;

      switch (status) {
        case "accepted":
          return (
            <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              <BadgeCheck data-icon="inline-start" />
              Accepted
            </Badge>
          );

        case "pending":
          return (
            <Badge className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
              <Clock data-icon="inline-start" />
              Pending
            </Badge>
          );

        case "revoked":
          return (
            <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
              <XCircle data-icon="inline-start" />
              Revoked
            </Badge>
          );

        case "expired":
          return (
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Info data-icon="inline-start" />
              Expired
            </Badge>
          );

        default:
          return null;
      }
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invited At" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const formatted = format(data.createdAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expires At" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const formatted = format(data.expiresAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      const status = row.original.status;

      return <PendingStudentTableActionButton id={id} status={status} />;
    },
  },
];

export const PendingStudentsTable = () => {
  const { data: pendingStudents, isLoading } = useQuery(
    orpc.owner.student.getPendingStudentsByOrg.queryOptions(),
  );

  return (
    <DataTable data={pendingStudents} columns={columns} loading={isLoading} />
  );
};
