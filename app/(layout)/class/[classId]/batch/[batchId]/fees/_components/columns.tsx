"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPaise } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import {
  isOfflineMethod,
  METHOD_META,
  type RosterRow,
  type RosterStatus,
} from "./utils";

const STATUS_META: Record<RosterStatus, { label: string; badge: string }> = {
  PAID: {
    label: "Paid",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  },
  UNPAID: {
    label: "Unpaid",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  },
  NOT_DUE: {
    label: "Not due",
    badge: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
  },
};

interface RosterColumnHandlers {
  onRecord: (row: RosterRow) => void;
  onUndo: (row: RosterRow) => void;
}

export function getRosterColumns({
  onRecord,
  onUndo,
}: RosterColumnHandlers): ColumnDef<RosterRow>[] {
  return [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {row.original.fullName || "Unnamed student"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.email}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const meta = STATUS_META[row.original.status];
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase",
              meta.badge,
            )}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) =>
        row.original.status === "NOT_DUE" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="tabular-nums">
            {formatPaise(row.original.amountPaise)}
          </span>
        ),
    },
    {
      id: "method",
      header: "Method",
      cell: ({ row }) => {
        const payment = row.original.payment;
        if (row.original.status !== "PAID" || !payment) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <Badge variant="secondary">{METHOD_META[payment.method].label}</Badge>
        );
      },
    },
    {
      id: "paidAt",
      header: "Paid on",
      cell: ({ row }) => {
        const payment = row.original.payment;
        if (row.original.status !== "PAID" || !payment?.paidAt) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="text-muted-foreground tabular-nums">
            {format(new Date(payment.paidAt), "d MMM yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const r = row.original;
        const canRecord = r.status === "UNPAID";
        const canUndo =
          r.status === "PAID" &&
          r.payment != null &&
          isOfflineMethod(r.payment.method);

        if (!canRecord && !canUndo) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="size-8 p-0" />}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canRecord && (
                <DropdownMenuItem onClick={() => onRecord(r)}>
                  Record payment
                </DropdownMenuItem>
              )}
              {canUndo && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onUndo(r)}
                >
                  Undo payment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
