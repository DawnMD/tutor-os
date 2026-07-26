import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { TableActionsMenu } from "./table-actions-menu";

// student type
export type Student =
  Outputs["owner"]["batchStudent"]["getStudentsByBatch"][number];

// table columns
export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Full Name" />
    ),
    cell: ({ row }) => {
      return (
        <Button
          nativeButton={false}
          render={
            <Link
              href={`/class/${row.original.classId}/batch/${row.original.batchId}/students/${row.original.id}`}
            />
          }
          variant={"link"}
          className={row.original.archivedAt ? "text-muted-foreground" : ""}
        >
          {row.original.fullName}
        </Button>
      );
    },
  },
  {
    id: "status",
    accessorFn: (row) => row.archivedAt,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      return row.original.archivedAt ? (
        <Badge variant="secondary">Archived</Badge>
      ) : (
        <Badge variant="outline">Active</Badge>
      );
    },
  },
  {
    accessorKey: "guardianName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guardian Name" />
    ),
  },
  {
    accessorKey: "guardianPhone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guardian Phone" />
    ),
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined At" />
    ),
    cell: ({ row }) => {
      const formatted = format(row.original.joinedAt, "PPP");

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
