"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/orpc/client";
import { Outputs } from "@/orpc/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UploadNoteDialog } from "./upload-note-dialog";
import { formatFileSize, noteIcon } from "./utils";

type Note = Outputs["owner"]["note"]["getNotesByBatch"][number];

interface BatchNotesContentProps {
  batchId: string;
}

export default function BatchNotesContent({ batchId }: BatchNotesContentProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery(
    orpc.owner.note.getNotesByBatch.queryOptions({ input: { batchId } }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Notes
          </h1>
          <p className="text-sm text-muted-foreground">
            Share study material with this batch — PDFs and images.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Upload notes</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : isError ? (
        <Card className="border-dashed py-0">
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Notes unavailable</EmptyTitle>
              <EmptyDescription>
                This batch may be archived, deleted, or you don&apos;t have
                access to it.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : !notes || notes.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No notes yet</EmptyTitle>
            <EmptyDescription>
              Upload PDFs or images to share study material with this batch.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="size-4" />
              Upload notes
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
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
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => setPendingDelete(note)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <UploadNoteDialog
        batchId={batchId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />

      <DeleteNoteDialog
        batchId={batchId}
        note={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      />
    </div>
  );
}

function DeleteNoteDialog({
  batchId,
  note,
  onOpenChange,
}: {
  batchId: string;
  note: Note | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    orpc.owner.note.deleteNote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.note.getNotesByBatch.queryKey({
            input: { batchId },
          }),
        });
        onOpenChange(false);
      },
    }),
  );

  function onDelete() {
    if (!note) return;
    toast.promise(mutateAsync({ noteId: note.id }), {
      loading: "Deleting note...",
      success: "Note deleted",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to delete note",
    });
  }

  return (
    <Dialog
      open={note != null}
      onOpenChange={onOpenChange}
      disablePointerDismissal
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete note</DialogTitle>
          <DialogDescription>
            Permanently delete{" "}
            <span className="font-medium text-foreground">{note?.title}</span>?
            This removes the file for everyone and can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={onDelete} disabled={isPending}>
            Delete note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
