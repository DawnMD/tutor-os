import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { BadgeCheck, Clock, Info, XCircle } from "lucide-react";
import { TableActionsMenu } from "./table-actions-menu";

// student type
export type Student = Outputs["owner"]["student"]["getAllStudents"][number];

// table columns
export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Full Name" />
    ),
    cell: ({ row }) => {
      const fullName = row.original.fullName;

      return fullName ?? "-";
    },
  },
  {
    accessorKey: "emailAddress",
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

      return (
        <div className="flex gap-2 flex-wrap items-center">
          {data.batches.map((item) => (
            <Badge variant={"outline"} key={item.batch.id}>
              {item.batch.name}
            </Badge>
          ))}
        </div>
      );
    },
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

        case "archieved":
          return (
            <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              Archieved
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
      <DataTableColumnHeader column={column} title="Invitation Expires At" />
    ),
    cell: ({ row }) => {
      const expiresAt = row.original.expiresAt;
      const status = row.original.status;
      const formatted = format(expiresAt, "PPP");

      return status === "pending" ? formatted : "-";
    },
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined At" />
    ),
    cell: ({ row }) => {
      const joinedAt = row.original.joinedAt;
      const formatted = joinedAt ? format(joinedAt, "PPP") : "-";

      return formatted;
    },
  },
  {
    accessorKey: "archievedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Archieved At" />
    ),
    cell: ({ row }) => {
      const archievedAt = row.original.archievedAt;
      const formatted = archievedAt ? format(archievedAt, "PPP") : "-";

      return formatted;
    },
  },
  {
    accessorKey: "actions",
    cell: ({ row }) => {
      return <TableActionsMenu student={row.original} />;
    },
  },
];
