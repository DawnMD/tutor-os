import { ownerProcedure } from "@/orpc/orpc";
import { assertActiveBatch } from "@/orpc/router/owner/helpers";
import { ORPCError } from "@orpc/client";
import { UTApi } from "uploadthing/server";
import * as z from "zod";

/**
 * Lazily-created UTApi singleton, for the same reason `lib/razorpay.ts` defers
 * its client: constructing at module load makes the build's page-data
 * collection depend on the token being present.
 */
let utapiClient: UTApi | null = null;

function getUtapi(): UTApi {
  if (!utapiClient) {
    utapiClient = new UTApi();
  }
  return utapiClient;
}

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

      // Drop the DB row first. Either order can half-fail; this is the better
      // half to lose. A failed file delete leaves an orphaned blob nobody can
      // reach (wasted storage, sweepable), whereas deleting the file first and
      // then failing on the row leaves a note in the UI whose download 404s.
      const deleted = await context.db.batchNote.delete({
        where: { id: note.id },
      });

      try {
        await getUtapi().deleteFiles(note.fileKey);
      } catch (err) {
        // The note is already gone as far as the tutor is concerned — don't
        // fail their delete over a storage cleanup.
        console.error(
          `[note] orphaned UploadThing file ${note.fileKey} after deleting note ${note.id}`,
          err,
        );
      }

      return deleted;
    }),
};
