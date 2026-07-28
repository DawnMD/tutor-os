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
import { orpc } from "@/orpc/client";
import { Outputs } from "@/orpc/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Edit2, Menu } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddStudent } from "./add-student";
import { ArchiveBatchDialog } from "./archive-batch-dialog";
import { EditBatchDialog } from "./edit-batch-dialog";

interface BatchHeaderProps {
  batch: NonNullable<Outputs["owner"]["batch"]["getBatchDataById"]>;
}

export default function BatchHeader({ batch }: BatchHeaderProps) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const isArchived = Boolean(batch.archivedAt);
  const classArchived = Boolean(batch.class.archivedAt);
  const isEffectivelyArchived = isArchived || classArchived;

  const { mutateAsync: unarchive, isPending: isUnarchiving } = useMutation(
    orpc.owner.batch.unArchieveBatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchDataById.queryKey({
            input: { batchId: batch.id },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchByOrg.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getCalendarData.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.class.getAllClass.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.dashboard.getDashboardData.key(),
        });
      },
    }),
  );

  const onUnarchive = () => {
    toast.promise(unarchive({ batchId: batch.id }), {
      loading: "Unarchiving batch...",
      success: "Batch unarchived",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to unarchive batch",
    });
  };

  return (
    <div
      data-tour="batch-header"
      className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-6"
    >
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
          {classArchived ? (
            <Badge variant="outline">Class archived</Badge>
          ) : isArchived ? (
            <Badge variant="outline">Archived</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{batch.students.length} Students</span>
          <span>•</span>
          <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <AddStudent
          batchName={batch.name}
          batchId={batch.id}
          disabled={isEffectivelyArchived}
        />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setEditOpen(true)}
              disabled={isEffectivelyArchived}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Batch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isArchived ? (
              <DropdownMenuItem
                onClick={onUnarchive}
                disabled={isUnarchiving || classArchived}
              >
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Unarchive Batch
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setArchiveOpen(true)}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Batch
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditBatchDialog
        key={`${batch.name}-${batch.color}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        batch={batch}
      />
      <ArchiveBatchDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        batchId={batch.id}
        batchName={batch.name}
      />
    </div>
  );
}
