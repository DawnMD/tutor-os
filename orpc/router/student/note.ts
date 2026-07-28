import { studentProcedure } from "@/orpc/orpc";
import {
  getCurrentStudent,
  getEnrolledBatch,
} from "@/orpc/router/student/helpers";
import * as z from "zod";

export const studentNoteRouter = {
  /**
   * Read-only notes for one enrolled batch. Guarded by {@link getEnrolledBatch}
   * so a student can never list notes for a batch they aren't in.
   */
  listByBatch: studentProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);
      await getEnrolledBatch(context, student.id, input.batchId);

      return await context.db.batchNote.findMany({
        where: { batchId: input.batchId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
      });
    }),
};
