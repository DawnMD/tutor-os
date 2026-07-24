import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Outputs } from "@/orpc/router";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
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
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined At" />
    ),
    cell: ({ row }) => {
      const joinedAt = row.original.createdAt;
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
      const archievedAt = row.original.archivedAt;
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
