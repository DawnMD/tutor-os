"use client";

import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { TableActionButton } from "./table-action-buttons";

export type Student =
  Outputs["owner"]["student"]["getActiveStudentsByOrg"][number];

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "batches",
    header: "Batches",
  },
  {
    accessorKey: "joinedAt",
    header: "Joined At",
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

      return <TableActionButton id={id} />;
    },
  },
];
