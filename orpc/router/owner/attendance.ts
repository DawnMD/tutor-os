import { ownerProcedure } from "@/orpc/orpc";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerAttendanceRouter = {
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
      const session = await context.db.batchSession.findFirst({
        where: {
          id: input.sessionId,
          batch: {
            clerkOrganizationId: context.organizationId,
          },
        },
        select: { id: true },
      });

      if (!session) {
        throw new ORPCError("NOT_FOUND");
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
