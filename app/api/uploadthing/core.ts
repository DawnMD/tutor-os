import { auth } from "@/lib/auth";
import { OrganizationRole } from "@/orpc/orpc";
import { db } from "@/prisma/db";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import * as z from "zod";

const f = createUploadthing();

/**
 * UploadThing file router. The `BatchNote` DB row is created here in
 * `onUploadComplete` (per-file) — not by a client follow-up mutation — so we
 * never trust a client-supplied fileKey and never orphan a stored file.
 *
 * `batchId`/`title`/`description` ride along via `.input()`. The middleware is
 * the auth boundary for uploads: it throws {@link UploadThingError} (whose
 * message reaches the browser's `onUploadError`) rather than reusing the oRPC
 * guards, which raise ORPCErrors the UploadThing client can't surface.
 */
export const uploadRouter = {
  batchNote: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .input(
      z.object({
        batchId: z.string(),
        title: z.string().trim().max(120).optional(),
        description: z.string().trim().max(1000).optional(),
      }),
    )
    .middleware(async ({ req, input }) => {
      // Read from the request UploadThing hands us rather than `next/headers`:
      // this is a route handler, not an RSC, so the cached helpers in
      // `lib/roles.ts` don't apply here.
      const session = await auth.api.getSession({ headers: req.headers });
      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;

      if (!userId || !orgId) {
        throw new UploadThingError("You must be signed in to upload notes.");
      }

      const membership = await db.member.findFirst({
        where: { organizationId: orgId, userId },
        select: { role: true },
      });

      if (membership?.role !== OrganizationRole.OWNER) {
        throw new UploadThingError("Only owners can upload notes.");
      }

      // Effective-active check: the batch must exist in the active org and
      // neither it nor its class may be archived.
      const batch = await db.batch.findFirst({
        where: {
          id: input.batchId,
          organizationId: orgId,
          archivedAt: null,
          class: { archivedAt: null },
        },
        select: { id: true },
      });

      if (!batch) {
        throw new UploadThingError(
          "This batch is unavailable or archived. Restore it before uploading.",
        );
      }

      return {
        userId,
        orgId,
        batchId: input.batchId,
        title: input.title,
        description: input.description,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.batchNote.create({
        data: {
          organizationId: metadata.orgId,
          batchId: metadata.batchId,
          title: metadata.title || file.name,
          description: metadata.description,
          fileKey: file.key,
          fileUrl: file.ufsUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedByUserId: metadata.userId,
        },
      });

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
