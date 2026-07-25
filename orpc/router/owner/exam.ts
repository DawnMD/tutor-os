import { ownerProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerExamRouter = {
  getExamsByBatch: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return await context.db.exam.findMany({
        where: { batchId: input.batchId },
        orderBy: { examDate: "desc" },
        select: {
          id: true,
          title: true,
          totalMarks: true,
          examDate: true,
        },
      });
    }),
  upsertExamResult: ownerProcedure
    .input(
      z.object({
        examId: z.string(),
        studentId: z.string(),
        marks: z.number(),
        remarks: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const exam = await context.db.exam.findFirst({
        where: {
          id: input.examId,
          batch: {
            clerkOrganizationId: context.organizationId,
          },
        },
        select: {
          id: true,
          totalMarks: true,
        },
      });

      if (!exam) {
        throw new ORPCError("NOT_FOUND");
      }

      if (input.marks < 0 || input.marks > exam.totalMarks) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Marks must be between 0 and ${exam.totalMarks}`,
        });
      }

      return await context.db.examResult.upsert({
        where: {
          examId_studentId: {
            examId: input.examId,
            studentId: input.studentId,
          },
        },
        create: {
          examId: input.examId,
          studentId: input.studentId,
          marks: input.marks,
          remarks: input.remarks,
        },
        update: {
          marks: input.marks,
          remarks: input.remarks,
        },
      });
    }),
};
