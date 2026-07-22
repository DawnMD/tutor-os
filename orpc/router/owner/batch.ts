import { ownerProcedure } from "@/orpc/orpc";
import * as z from "zod";

export const ownerBatchRouter = {
  createBatch: ownerProcedure
    .input(
      z.object({
        name: z.string(),
        classId: z.string(),
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
};
