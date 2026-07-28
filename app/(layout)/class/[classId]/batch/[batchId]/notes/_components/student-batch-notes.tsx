"use client";

import { StudentArchivedState } from "@/components/student/student-archived-state";
import { StudentGate } from "@/components/student/student-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getArchivedScope } from "@/lib/archived-error";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { formatFileSize, noteIcon } from "./utils";

export function StudentBatchNotes({ batchId }: { batchId: string }) {
  return (
    <StudentGate>
      <StudentBatchNotesBody batchId={batchId} />
    </StudentGate>
  );
}

function StudentBatchNotesBody({ batchId }: { batchId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    ...orpc.student.note.listByBatch.queryOptions({ input: { batchId } }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (isError) {
    const scope = getArchivedScope(error);
    if (scope === "batch" || scope === "class") {
      return <StudentArchivedState scope={scope} />;
    }
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>Notes not available</EmptyTitle>
          <EmptyDescription>
            This batch doesn&apos;t exist or you&apos;re not enrolled in it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No notes shared yet</EmptyTitle>
          <EmptyDescription>
            When your tutor shares study material for this batch, it&apos;ll
            appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notes</h1>
        <p className="text-sm text-muted-foreground">
          Study material shared by your tutor.
        </p>
      </div>

      <ul className="space-y-3">
        {data.map((note) => {
          const Icon = noteIcon(note.fileType);
          return (
            <li key={note.id}>
              <Card className="flex flex-row items-start gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{note.title}</p>
                  {note.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {note.description}
                    </p>
                  ) : null}
                  <p className="truncate text-xs text-muted-foreground">
                    {note.fileName} · {formatFileSize(note.fileSize)} ·{" "}
                    {format(new Date(note.createdAt), "d MMM yyyy")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  render={
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Open
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
