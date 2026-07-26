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
  getSessionsPage: ownerProcedure
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
        },
        select: {
          id: true,
          name: true,
          classId: true,
          class: { select: { id: true, name: true } },
          schedules: {
            orderBy: { dayOfWeek: "asc" },
            select: {
              id: true,
              dayOfWeek: true,
              startMinutes: true,
              endMinutes: true,
            },
          },
          _count: {
            select: {
              students: { where: { student: { archivedAt: null } } },
            },
          },
          sessions: {
            orderBy: { classDate: "desc" },
            select: {
              id: true,
              classDate: true,
              topic: true,
              summary: true,
              completedAt: true,
              createdAt: true,
              attendance: {
                select: {
                  status: true,
                  student: { select: { id: true, fullName: true } },
                },
              },
            },
          },
        },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return batch;
    }),
  createSession: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        classDate: z.coerce.date(),
        topic: z.string().trim().min(1, "Session title is required"),
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
  updateSession: ownerProcedure
    .input(
      z.object({
        sessionId: z.string(),
        classDate: z.coerce.date(),
        topic: z.string().trim().min(1, "Session title is required"),
        summary: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await context.db.batchSession.findFirst({
        where: {
          id: input.sessionId,
          batch: {
            clerkOrganizationId: context.organizationId,
            archivedAt: null,
          },
        },
        select: { id: true, batchId: true },
      });

      if (!session) {
        throw new ORPCError("NOT_FOUND");
      }

      // Guard the unique [batchId, classDate] constraint on date changes.
      const clash = await context.db.batchSession.findUnique({
        where: {
          batchId_classDate: {
            batchId: session.batchId,
            classDate: input.classDate,
          },
        },
        select: { id: true },
      });

      if (clash && clash.id !== session.id) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Another session already exists for that date",
        });
      }

      return await context.db.batchSession.update({
        where: { id: input.sessionId },
        data: {
          classDate: input.classDate,
          topic: input.topic,
          summary: input.summary ?? null,
        },
      });
    }),
  completeSession: ownerProcedure
    .input(
      z.object({
        sessionId: z.string(),
        completed: z.boolean(),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await context.db.batchSession.findFirst({
        where: {
          id: input.sessionId,
          batch: {
            clerkOrganizationId: context.organizationId,
            archivedAt: null,
          },
        },
        select: { id: true },
      });

      if (!session) {
        throw new ORPCError("NOT_FOUND");
      }

      return await context.db.batchSession.update({
        where: { id: input.sessionId },
        data: {
          completedAt: input.completed ? new Date() : null,
        },
      });
    }),
};
