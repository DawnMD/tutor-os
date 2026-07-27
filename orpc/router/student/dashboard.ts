import { studentProcedure } from "@/orpc/orpc";
import {
  enrolledActiveBatchWhere,
  getCurrentStudent,
} from "@/orpc/router/student/helpers";
import * as z from "zod";

/**
 * Single aggregation for the student dashboard. Mirrors
 * `owner.dashboard.getDashboardData`: returns raw-ish, student-scoped rows in
 * one round-trip; all bucketing/derivation happens client-side in
 * `lib/student-dashboard-stats.ts` so date math stays in the viewer's local
 * timezone (matching the calendar).
 *
 * Every nested `attendance`/`results` select carries `where: { studentId }` so
 * the payload can never contain another student's rows.
 */
export const studentDashboardRouter = {
  getDashboardData: studentProcedure
    .input(
      z.object({
        rangeStart: z.coerce.date(),
        rangeEnd: z.coerce.date(),
      }),
    )
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);

      const [batches, attendanceTotals] = await Promise.all([
        context.db.batch.findMany({
          where: enrolledActiveBatchWhere(context.organizationId, student.id),
          select: {
            id: true,
            name: true,
            color: true,
            classId: true,
            class: { select: { name: true } },
            schedules: {
              select: {
                dayOfWeek: true,
                startMinutes: true,
                endMinutes: true,
              },
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
                attendance: {
                  where: { studentId: student.id },
                  select: { status: true },
                },
              },
            },
            exams: {
              where: {
                examDate: { gte: input.rangeStart, lte: input.rangeEnd },
              },
              select: {
                id: true,
                title: true,
                examDate: true,
                totalMarks: true,
                completedAt: true,
                results: {
                  where: { studentId: student.id },
                  select: { marks: true, remarks: true },
                },
              },
            },
          },
        }),
        // All-time attendance totals across the student's enrolled active
        // batches — used for the headline attendance-rate KPI.
        context.db.attendanceRecord.groupBy({
          by: ["status"],
          where: {
            studentId: student.id,
            session: {
              batch: enrolledActiveBatchWhere(
                context.organizationId,
                student.id,
              ),
            },
          },
          _count: { _all: true },
        }),
      ]);

      return {
        batches,
        attendanceTotals: attendanceTotals.map((row) => ({
          status: row.status,
          count: row._count._all,
        })),
      };
    }),
};
