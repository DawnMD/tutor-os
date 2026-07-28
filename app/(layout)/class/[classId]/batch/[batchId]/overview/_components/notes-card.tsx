"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import {
  formatFileSize,
  noteIcon,
} from "../../notes/_components/utils";

interface NotesCardProps {
  batchId: string;
  classId: string;
}

export default function NotesCard({ batchId, classId }: NotesCardProps) {
  const notesHref = `/class/${classId}/batch/${batchId}/notes`;

  const { data: notes, isLoading } = useQuery(
    orpc.owner.note.getNotesByBatch.queryOptions({ input: { batchId } }),
  );

  const recent = notes?.slice(0, 3) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Notes</CardTitle>
            {notes && notes.length > 0 && (
              <CardDescription>{notes.length} shared</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </>
        ) : recent.length > 0 ? (
          recent.map((note) => {
            const Icon = noteIcon(note.fileType);
            return (
              <a
                key={note.id}
                href={note.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{note.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {note.fileName} · {formatFileSize(note.fileSize)}
                  </p>
                </div>
              </a>
            );
          })
        ) : (
          <div className="py-4 text-center">
            <FileText className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notes shared yet</p>
          </div>
        )}

        <Button
          variant="outline"
          nativeButton={false}
          className="mt-2 w-full"
          render={<Link href={notesHref} />}
        >
          <Plus className="mr-2 size-4" />
          {recent.length > 0 ? "Manage notes" : "Upload notes"}
        </Button>
      </CardContent>
    </Card>
  );
}
