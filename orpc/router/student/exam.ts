import { studentProcedure } from "@/orpc/orpc";
import {
  getCurrentStudent,
  getEnrolledBatch,
} from "@/orpc/router/student/helpers";
import * as z from "zod";

export const studentExamRouter = {
  /**
   * Exams for one enrolled batch with the current student's OWN result only.
   * Guarded by {@link getEnrolledBatch}. `results` is always filtered to
   * `studentId` — never selected unfiltered — so the payload can never leak
   * another student's marks (no class average / rank, per product decision).
   */
  getByBatch: studentProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);
      const batch = await getEnrolledBatch(context, student.id, input.batchId);

      const exams = await context.db.exam.findMany({
        where: { batchId: input.batchId },
        orderBy: { examDate: "desc" },
        select: {
          id: true,
          title: true,
          totalMarks: true,
          examDate: true,
          completedAt: true,
          results: {
            where: { studentId: student.id },
            select: { marks: true, remarks: true },
          },
        },
      });

      return {
        batchId: batch.id,
        classId: batch.classId,
        exams,
      };
    }),
};
