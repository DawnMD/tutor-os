"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveBatchColor } from "@/lib/batch-colors";
import { cn } from "@/lib/utils";
import { Outputs } from "@/orpc/router";
import { Archive, Edit2, Menu } from "lucide-react";
import { AddStudent } from "./add-student";

interface BatchHeaderProps {
  batch: NonNullable<Outputs["owner"]["batch"]["getBatchDataById"]>;
}

export default function BatchHeader({ batch }: BatchHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              "size-3 shrink-0 rounded-full",
              resolveBatchColor(batch.color, batch.id).dot,
            )}
          />
          <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
          <Badge variant="secondary">{batch.class.name}</Badge>
          {!batch.archivedAt && <Badge variant="default">Active</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{batch.students.length} Students</span>
          <span>•</span>
          <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <AddStudent batchName={batch.name} batchId={batch.id} />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Batch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Archive className="w-4 h-4 mr-2" />
              Archive Batch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
