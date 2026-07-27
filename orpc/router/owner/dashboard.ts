import { ownerProcedure } from "@/orpc/orpc";
import { activeBatchWhere } from "@/orpc/router/owner/helpers";
import * as z from "zod";

/**
 * Single org-wide aggregation for the owner dashboard. Returns raw-ish,
 * org-scoped rows in one round-trip; all bucketing/derivation happens on the
 * client in `lib/dashboard-stats.ts` (org-scale data is small, and this keeps
 * every date computation in the viewer's local timezone — matching the
 * calendar's approach).
 */
export const ownerDashboardRouter = {
  getDashboardData: ownerProcedure
    .input(
      z.object({
        rangeStart: z.coerce.date(),
        rangeEnd: z.coerce.date(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [batches, activeStudentCount, classCount, recentStudents] =
        await Promise.all([
          context.db.batch.findMany({
            where: activeBatchWhere(context.organizationId),
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
                    select: { studentId: true, status: true },
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
                },
              },
              students: {
                where: { student: { archivedAt: null } },
                select: {
                  student: {
                    select: { id: true, fullName: true, email: true },
                  },
                },
              },
            },
          }),
          context.db.student.count({
            where: {
              clerkOrganizationId: context.organizationId,
              archivedAt: null,
            },
          }),
          context.db.class.count({
            where: {
              clerkOrganizationId: context.organizationId,
              archivedAt: null,
            },
          }),
          context.db.student.findMany({
            where: {
              clerkOrganizationId: context.organizationId,
              archivedAt: null,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              fullName: true,
              email: true,
              createdAt: true,
            },
          }),
        ]);

      return { batches, activeStudentCount, classCount, recentStudents };
    }),
};
