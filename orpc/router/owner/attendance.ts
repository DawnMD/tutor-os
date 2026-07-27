import { ownerProcedure } from "@/orpc/orpc";
import {
  assertActiveBatch,
  assertActiveSession,
} from "@/orpc/router/owner/helpers";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerAttendanceRouter = {
  /**
   * Everything the batch Attendance page needs in a single round-trip: the batch
   * (with schedules), its active roster, and every session with its attendance
   * records. Deriving today's session, KPIs and per-student summaries is left to
   * the client so the page can react instantly while marking.
   */
  getAttendanceOverview: ownerProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

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
          students: {
            where: { student: { archivedAt: null } },
            orderBy: { student: { fullName: "asc" } },
            select: {
              student: {
                select: { id: true, fullName: true, email: true },
              },
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
                select: { studentId: true, status: true, remarks: true },
              },
            },
          },
        },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      const { students, ...rest } = batch;
      return {
        ...rest,
        students: students.map((s) => s.student),
      };
    }),
  /**
   * Record attendance for many students at once (the daily marking workflow).
   * Runs as a single transaction so a saved sheet is all-or-nothing, and can
   * optionally mark the session complete in the same call ("Save & Complete").
   */
  markAttendanceBulk: ownerProcedure
    .input(
      z.object({
        sessionId: z.string(),
        records: z.array(
          z.object({
            studentId: z.string(),
            status: z.enum(AttendanceStatus),
            remarks: z.string().optional(),
          }),
        ),
        complete: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await assertActiveSession(context, input.sessionId);

      // A completed session is locked: the only permitted action is reopening
      // it (complete === false). Any attempt to change attendance is rejected.
      if (session.completedAt && input.complete !== false) {
        throw new ORPCError("CONFLICT", {
          message:
            "This session is completed. Reopen it before changing attendance.",
        });
      }

      await context.db.$transaction(async (tx) => {
        for (const record of input.records) {
          await tx.attendanceRecord.upsert({
            where: {
              sessionId_studentId: {
                sessionId: input.sessionId,
                studentId: record.studentId,
              },
            },
            create: {
              sessionId: input.sessionId,
              studentId: record.studentId,
              status: record.status,
              remarks: record.remarks,
            },
            update: {
              status: record.status,
              remarks: record.remarks,
            },
          });
        }

        if (input.complete !== undefined) {
          await tx.batchSession.update({
            where: { id: input.sessionId },
            data: { completedAt: input.complete ? new Date() : null },
          });
        }
      });

      return { count: input.records.length };
    }),
  markAttendance: ownerProcedure
    .input(
      z.object({
        sessionId: z.string(),
        studentId: z.string(),
        status: z.enum(AttendanceStatus),
        remarks: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await assertActiveSession(context, input.sessionId);

      // The student must be an active member of the session's batch.
      const member = await context.db.batchStudent.findFirst({
        where: {
          batchId: session.batchId,
          studentId: input.studentId,
          student: { archivedAt: null },
        },
      });
      if (!member) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Student is not an active member of this batch",
        });
      }

      return await context.db.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: input.sessionId,
            studentId: input.studentId,
          },
        },
        create: {
          sessionId: input.sessionId,
          studentId: input.studentId,
          status: input.status,
          remarks: input.remarks,
        },
        update: {
          status: input.status,
          remarks: input.remarks,
        },
      });
    }),
};
