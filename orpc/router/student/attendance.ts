import { studentProcedure } from "@/orpc/orpc";
import {
  getCurrentStudent,
  getEnrolledBatch,
} from "@/orpc/router/student/helpers";
import * as z from "zod";

export const studentAttendanceRouter = {
  /**
   * The current student's own attendance records for one enrolled batch.
   * Guarded by {@link getEnrolledBatch}; the query is scoped to `studentId` +
   * `session.batchId` so it can never surface another student's rows.
   */
  getByBatch: studentProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);
      const batch = await getEnrolledBatch(context, student.id, input.batchId);

      const records = await context.db.attendanceRecord.findMany({
        where: {
          studentId: student.id,
          session: { batchId: input.batchId },
        },
        orderBy: { session: { classDate: "desc" } },
        select: {
          status: true,
          remarks: true,
          session: {
            select: { id: true, classDate: true, topic: true },
          },
        },
      });

      return {
        batchId: batch.id,
        classId: batch.classId,
        records,
      };
    }),
};
