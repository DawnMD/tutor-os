import { ownerProcedure } from "@/orpc/orpc";
import { assertActiveBatch } from "@/orpc/router/owner/helpers";
import { ORPCError } from "@orpc/client";
import { UTApi } from "uploadthing/server";
import * as z from "zod";

const utapi = new UTApi();

const noteSelect = {
  id: true,
  title: true,
  description: true,
  fileUrl: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  createdAt: true,
} as const;

export const ownerNoteRouter = {
  getNotesByBatch: ownerProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

      return await context.db.batchNote.findMany({
        where: { batchId: input.batchId },
        orderBy: { createdAt: "desc" },
        select: noteSelect,
      });
    }),
  deleteNote: ownerProcedure
    .input(z.object({ noteId: z.string() }))
    .handler(async ({ context, input }) => {
      const note = await context.db.batchNote.findFirst({
        where: {
          id: input.noteId,
          clerkOrganizationId: context.organizationId,
        },
        select: { id: true, batchId: true, fileKey: true },
      });

      if (!note) {
        throw new ORPCError("NOT_FOUND");
      }

      await assertActiveBatch(context, note.batchId);

      // Delete the stored file first: if this fails the DB row survives and the
      // delete is retryable, so we never leave a live row pointing at a dead
      // file (the reverse would strand the file with no way to reach it).
      await utapi.deleteFiles(note.fileKey);

      return await context.db.batchNote.delete({ where: { id: note.id } });
    }),
};
