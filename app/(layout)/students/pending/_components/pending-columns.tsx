import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { PendingActionsMenu } from "./pending-actions-menu";

// pending invitation type
export type PendingInvitation =
  Outputs["owner"]["student"]["getPendingInvitations"][number];

// table columns
export const pendingColumns: ColumnDef<PendingInvitation>[] = [
  {
    accessorKey: "emailAddress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invited At" />
    ),
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      return createdAt ? format(createdAt, "PPP") : "-";
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expires At" />
    ),
    cell: ({ row }) => {
      const expiresAt = row.original.expiresAt;
      return expiresAt ? format(expiresAt, "PPP") : "-";
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      return <Badge variant="outline">{row.original.status}</Badge>;
    },
  },
  {
    accessorKey: "actions",
    cell: ({ row }) => {
      return <PendingActionsMenu invitation={row.original} />;
    },
  },
];
