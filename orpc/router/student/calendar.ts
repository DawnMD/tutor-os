import { studentProcedure } from "@/orpc/orpc";
import {
  enrolledActiveBatchWhere,
  getCurrentStudent,
} from "@/orpc/router/student/helpers";
import * as z from "zod";

/**
 * Calendar data for the current student's enrolled, active batches. Same select
 * shape as `owner.batch.getCalendarData` (so both satisfy the standalone
 * `CalendarBatch` type in `lib/calendar-events.ts`), but scoped by
 * {@link enrolledActiveBatchWhere} and carrying no attendance/results sub-selects.
 */
export const studentCalendarRouter = {
  getCalendarData: studentProcedure
    .input(
      z.object({
        rangeStart: z.coerce.date(),
        rangeEnd: z.coerce.date(),
      }),
    )
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);

      const [batches, holidays] = await Promise.all([
        context.db.batch.findMany({
          where: enrolledActiveBatchWhere(context.organizationId, student.id),
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
        // Holidays are org-wide, safe to expose to students.
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
};
