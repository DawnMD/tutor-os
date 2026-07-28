"use client";

import { Button } from "@/components/ui/button";
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { orpc } from "@/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { formatFileSize } from "./utils";

const ACCEPT = "application/pdf,image/*";

const formSchema = z.object({
  title: z.string().trim().max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer"),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadNoteDialogProps {
  batchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadNoteDialog({
  batchId,
  open,
  onOpenChange,
}: UploadNoteDialogProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "" },
  });

  function reset() {
    form.reset();
    setFiles([]);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const { startUpload, isUploading } = useUploadThing("batchNote", {
    onClientUploadComplete: () => {
      toast.success(
        files.length > 1 ? "Notes uploaded" : "Note uploaded",
      );
      queryClient.invalidateQueries({
        queryKey: orpc.owner.note.getNotesByBatch.queryKey({
          input: { batchId },
        }),
      });
      reset();
      onOpenChange(false);
    },
    onUploadError: (err) => {
      toast.error(err.message || "Failed to upload notes");
    },
  });

  function handleOpenChange(next: boolean) {
    if (isUploading) return;
    if (!next) reset();
    onOpenChange(next);
  }

  function onFilesPicked(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list));
    setFileError(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit(data: FormValues) {
    if (files.length === 0) {
      setFileError("Select at least one file to upload.");
      return;
    }
    startUpload(files, {
      batchId,
      title: data.title.trim() || undefined,
      description: data.description.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload notes</DialogTitle>
          <DialogDescription>
            Add PDFs or images for this batch. Each file becomes its own note.
          </DialogDescription>
        </DialogHeader>
        <form id="upload-note-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(fileError)}>
              <FieldLabel>Files</FieldLabel>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => onFilesPicked(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start font-normal"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="size-4 text-muted-foreground" />
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                  : "Choose PDFs or images"}
              </Button>
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Paperclip className="size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {file.name}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <FieldDescription>
                PDFs up to 16MB and images up to 8MB, 5 of each per upload.
              </FieldDescription>
              {fileError && <FieldError>{fileError}</FieldError>}
            </Field>

            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="note-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="note-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Chapter 5 — Thermodynamics"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Leave blank to use each file&apos;s name.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="note-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="note-description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Optional — what's in these files?"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={isUploading}>
                Cancel
              </Button>
            }
          />
          <Button
            type="submit"
            form="upload-note-form"
            disabled={isUploading}
            className={cn(isUploading && "pointer-events-none")}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
