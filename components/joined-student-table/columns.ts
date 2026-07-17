"use client";

import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";

export type Student = Outputs["owner"]["student"]["getActiveStudentsByOrg"][number];

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
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];
