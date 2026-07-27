import { BATCH_COLOR_IDS } from "@/lib/batch-colors";
import { ownerProcedure } from "@/orpc/orpc";
import {
  archivedError,
  assertActiveBatch,
  assertActiveClass,
  activeBatchWhere,
  getOwnedBatch,
} from "@/orpc/router/owner/helpers";
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
      // Validates classId ownership (was missing) and blocks archived classes.
      await assertActiveClass(context, input.classId);

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
    .handler(async ({ context, input }) => {
      const [batches, holidays] = await Promise.all([
        context.db.batch.findMany({
          where: activeBatchWhere(context.organizationId),
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
              where: {
                classDate: { gte: input.rangeStart, lte: input.rangeEnd },
              },
              select: {
                id: true,
                classDate: true,
                topic: true,
                completedAt: true,
              },
            },
            exams: {
              where: {
                examDate: { gte: input.rangeStart, lte: input.rangeEnd },
              },
              select: { id: true, title: true, examDate: true },
            },
            overrides: {
              // Cross-month moves must appear on both source and target sides.
              where: {
                OR: [
                  { date: { gte: input.rangeStart, lte: input.rangeEnd } },
                  { newDate: { gte: input.rangeStart, lte: input.rangeEnd } },
                ],
              },
              select: {
                id: true,
                type: true,
                date: true,
                newDate: true,
                startMinutes: true,
                endMinutes: true,
                reason: true,
              },
            },
          },
        }),
        context.db.holiday.findMany({
          where: {
            clerkOrganizationId: context.organizationId,
            date: { gte: input.rangeStart, lte: input.rangeEnd },
          },
          select: { id: true, date: true, name: true },
        }),
      ]);

      return { batches, holidays };
    }),
  getBatchByOrg: ownerProcedure.handler(async ({ context }) => {
    return await context.db.batch.findMany({
      where: {
        clerkOrganizationId: context.organizationId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            archivedAt: true,
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
      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
        },
        select: {
          id: true,
          name: true,
          color: true,
          classId: true,
          archivedAt: true,
          createdAt: true,
          class: { select: { id: true, name: true, archivedAt: true } },
          _count: { select: { students: true } }, // total incl. archived
          students: {
            where: { student: { archivedAt: null } },
            orderBy: { joinedAt: "desc" },
            select: {
              studentId: true,
              joinedAt: true,
              student: { select: { id: true, fullName: true, email: true } },
            },
          },
          schedules: {
            orderBy: { dayOfWeek: "asc" },
            select: {
              id: true,
              dayOfWeek: true,
              startMinutes: true,
              endMinutes: true,
            },
          },
          sessions: {
            orderBy: { classDate: "desc" },
            take: 10,
            select: {
              id: true,
              classDate: true,
              topic: true,
              summary: true,
              completedAt: true,
              attendance: { select: { studentId: true, status: true } },
            },
          },
          exams: {
            orderBy: { examDate: "desc" },
            take: 5,
            select: {
              id: true,
              title: true,
              totalMarks: true,
              examDate: true,
              completedAt: true,
              results: { select: { marks: true } },
            },
          },
        },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return batch;
    }),
  updateBatch: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        name: z.string().trim().min(1),
        color: z.enum(BATCH_COLOR_IDS),
      }),
    )
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

      return await context.db.batch.update({
        where: { id: input.batchId },
        data: { name: input.name, color: input.color },
      });
    }),
  archieveBatch: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      // Idempotent: re-archiving an already-archived batch used to throw a
      // confusing NOT_FOUND.
      await getOwnedBatch(context, input.batchId, { allowArchived: true });

      return await context.db.batch.update({
        where: { id: input.batchId },
        data: { archivedAt: new Date() },
      });
    }),
  unArchieveBatch: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const batch = await getOwnedBatch(context, input.batchId, {
        allowArchived: true,
      });

      // A batch inside an archived class can't be unarchived on its own — the
      // class must be restored first.
      if (batch.class.archivedAt) {
        throw archivedError("class");
      }

      return await context.db.batch.update({
        where: { id: input.batchId },
        data: { archivedAt: null },
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
      await assertActiveBatch(context, input.batchId);

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
