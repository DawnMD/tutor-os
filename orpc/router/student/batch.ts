import { studentProcedure } from "@/orpc/orpc";
import {
  enrolledActiveBatchWhere,
  getCurrentStudent,
  getEnrolledBatch,
} from "@/orpc/router/student/helpers";
import * as z from "zod";

export const studentBatchRouter = {
  /**
   * The current student's enrolled, active batches. Feeds the "My Batches"
   * sidebar collapsible — carries `classId` + `class.name` so links to the
   * shared `/class/[classId]/batch/[batchId]/*` routes can be built.
   */
  list: studentProcedure.handler(async ({ context }) => {
    const student = await getCurrentStudent(context);

    const batches = await context.db.batch.findMany({
      where: enrolledActiveBatchWhere(context.organizationId, student.id),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        color: true,
        classId: true,
        class: { select: { name: true } },
        schedules: {
          select: { dayOfWeek: true, startMinutes: true, endMinutes: true },
        },
        students: {
          where: { studentId: student.id },
          select: { joinedAt: true },
        },
      },
    });

    return batches.map(({ students, ...batch }) => ({
      ...batch,
      joinedAt: students[0]?.joinedAt ?? null,
    }));
  }),

  /**
   * Overview for a single enrolled batch: schedule + recent sessions with the
   * student's own attendance status. Guarded by {@link getEnrolledBatch}.
   */
  getOverview: studentProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);
      await getEnrolledBatch(context, student.id, input.batchId);

      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
          students: { some: { studentId: student.id } },
        },
        select: {
          id: true,
          name: true,
          color: true,
          classId: true,
          class: { select: { name: true } },
          schedules: {
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
              attendance: {
                where: { studentId: student.id },
                select: { status: true, remarks: true },
              },
            },
          },
        },
      });

      return batch;
    }),
};
