import { BATCH_COLOR_IDS } from "@/lib/batch-colors";
import { ownerProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import * as z from "zod";

export const ownerBatchRouter = {
  createBatch: ownerProcedure
    .input(
      z.object({
        name: z.string(),
        classId: z.string(),
        color: z.enum(BATCH_COLOR_IDS),
        schdeules: z.array(
          z.object({
            day: z.number(),
            start: z.number(),
            end: z.number(),
          }),
        ),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.db.$transaction(async (tx) => {
        const batch = await tx.batch.create({
          data: {
            clerkOrganizationId: context.organizationId,
            name: input.name,
            classId: input.classId,
            color: input.color,
          },
        });

        await tx.batchSchedule.createMany({
          data: input.schdeules.map((schedule) => ({
            batchId: batch.id,
            dayOfWeek: schedule.day,
            startMinutes: schedule.start,
            endMinutes: schedule.end,
          })),
        });

        return batch;
      });
    }),
  getCalendarData: ownerProcedure
    .input(
      z.object({
        rangeStart: z.coerce.date(),
        rangeEnd: z.coerce.date(),
      }),
    )
    .handler(async ({ context, input }) =>
      context.db.batch.findMany({
        where: {
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: {
          id: true,
          name: true,
          color: true,
          classId: true,
          class: { select: { name: true } },
          schedules: {
            select: { dayOfWeek: true, startMinutes: true, endMinutes: true },
          },
          sessions: {
            where: { classDate: { gte: input.rangeStart, lte: input.rangeEnd } },
            select: {
              id: true,
              classDate: true,
              topic: true,
              completedAt: true,
            },
          },
          exams: {
            where: { examDate: { gte: input.rangeStart, lte: input.rangeEnd } },
            select: { id: true, title: true, examDate: true },
          },
        },
      }),
    ),
  getBatchByOrg: ownerProcedure.handler(async ({ context }) => {
    return await context.db.batch.findMany({
      where: {
        clerkOrganizationId: context.organizationId,
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });
  }),
  getBatchDataById: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.batch.findUnique({
        where: { id: input.batchId },
        include: {
          class: true,
          students: {
            include: {
              student: true,
            },
          },
          schedules: true,
          sessions: {
            orderBy: { classDate: "desc" },
            take: 10,
            include: {
              attendance: true,
            },
          },
          exams: {
            orderBy: { examDate: "desc" },
            take: 5,
          },
        },
      });
    }),
  addStudent: ownerProcedure
    .input(
      z.object({
        studentIds: z.array(z.string()),
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

      const students = await context.db.student.findMany({
        where: {
          id: { in: input.studentIds },
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      });

      if (students.length !== input.studentIds.length) {
        throw new ORPCError("BAD_REQUEST");
      }

      await context.db.$transaction(async (tx) => {
        // Remove all current students from the batch
        await tx.batchStudent.deleteMany({
          where: {
            batchId: input.batchId,
          },
        });

        // Add the selected students
        if (input.studentIds.length > 0) {
          await tx.batchStudent.createMany({
            data: input.studentIds.map((studentId) => ({
              batchId: input.batchId,
              studentId,
            })),
            skipDuplicates: true,
          });
        }
      });

      return true;
    }),
};
