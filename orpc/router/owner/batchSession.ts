import { ownerProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerBatchSessionRouter = {
  getSessionsByBatch: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return await context.db.batchSession.findMany({
        where: { batchId: input.batchId },
        orderBy: { classDate: "desc" },
        select: {
          id: true,
          classDate: true,
          topic: true,
        },
      });
    }),
  createSession: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        classDate: z.coerce.date(),
        topic: z.string().optional(),
        summary: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      const existing = await context.db.batchSession.findUnique({
        where: {
          batchId_classDate: {
            batchId: input.batchId,
            classDate: input.classDate,
          },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ORPCError("BAD_REQUEST", {
          message: "A session already exists for that date",
        });
      }

      return await context.db.batchSession.create({
        data: {
          batchId: input.batchId,
          classDate: input.classDate,
          topic: input.topic,
          summary: input.summary,
        },
      });
    }),
};
