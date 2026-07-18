"use client";

import { Badge } from "@/components/ui/badge";
import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { BadgeCheck, Clock, Info, XCircle } from "lucide-react";
import { TableActionButton } from "./table-action-buttons";

export type Student =
  Outputs["owner"]["student"]["getPendingStudentsByOrg"][number];

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
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
    header: "Created At",
    cell: ({ row }) => {
      const data = row.original;
      const formatted = format(data.createdAt, "PPP");

      return formatted;
    },
  },
  {
    accessorKey: "expiresAt",
    header: "Expires At",
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

      return <TableActionButton id={id} />;
    },
  },
];
