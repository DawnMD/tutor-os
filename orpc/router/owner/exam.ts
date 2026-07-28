import { ownerProcedure } from "@/orpc/orpc";
import {
  assertActiveBatch,
  assertActiveExam,
  assertNotPastDate,
} from "@/orpc/router/owner/helpers";
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
      await assertActiveBatch(context, input.batchId);

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
  /**
   * Everything the batch Exams page needs in one round-trip: the batch, its
   * active-student count, and every exam with its results. The client derives
   * graded counts, averages and upcoming status.
   */
  getExamsPage: ownerProcedure
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
          _count: {
            select: {
              students: { where: { student: { archivedAt: null } } },
            },
          },
          exams: {
            orderBy: { examDate: "desc" },
            select: {
              id: true,
              title: true,
              totalMarks: true,
              examDate: true,
              completedAt: true,
              createdAt: true,
              results: {
                select: { studentId: true, marks: true },
              },
            },
          },
        },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return batch;
    }),
  createExam: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        title: z.string().trim().min(1, "Exam title is required"),
        totalMarks: z.number().int().min(1, "Total marks must be at least 1"),
        examDate: z.coerce.date(),
      }),
    )
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);
      assertNotPastDate(input.examDate, { label: "Exam date" });

      const existing = await context.db.exam.findUnique({
        where: {
          batchId_title: { batchId: input.batchId, title: input.title },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ORPCError("BAD_REQUEST", {
          message: "An exam with that title already exists in this batch",
        });
      }

      return await context.db.exam.create({
        data: {
          batchId: input.batchId,
          title: input.title,
          totalMarks: input.totalMarks,
          examDate: input.examDate,
        },
      });
    }),
  updateExam: ownerProcedure
    .input(
      z.object({
        examId: z.string(),
        title: z.string().trim().min(1, "Exam title is required"),
        totalMarks: z.number().int().min(1, "Total marks must be at least 1"),
        examDate: z.coerce.date(),
      }),
    )
    .handler(async ({ context, input }) => {
      const exam = await assertActiveExam(context, input.examId);
      assertNotPastDate(input.examDate, {
        allow: exam.examDate,
        label: "Exam date",
      });

      // Guard the unique [batchId, title] constraint on title changes.
      const clash = await context.db.exam.findUnique({
        where: {
          batchId_title: { batchId: exam.batchId, title: input.title },
        },
        select: { id: true },
      });

      if (clash && clash.id !== exam.id) {
        throw new ORPCError("BAD_REQUEST", {
          message: "An exam with that title already exists in this batch",
        });
      }

      // Don't let totalMarks drop below a score that's already recorded.
      const highest = await context.db.examResult.aggregate({
        where: { examId: input.examId },
        _max: { marks: true },
      });

      if (highest._max.marks !== null && input.totalMarks < highest._max.marks) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Total marks can't be lower than the highest recorded score (${highest._max.marks})`,
        });
      }

      return await context.db.exam.update({
        where: { id: input.examId },
        data: {
          title: input.title,
          totalMarks: input.totalMarks,
          examDate: input.examDate,
        },
      });
    }),
  deleteExam: ownerProcedure
    .input(z.object({ examId: z.string() }))
    .handler(async ({ context, input }) => {
      await assertActiveExam(context, input.examId);

      // ExamResult rows cascade via the schema relation.
      return await context.db.exam.delete({ where: { id: input.examId } });
    }),
  /**
   * One exam plus its batch's active roster and every recorded result, flattened
   * for the bulk grading grid.
   */
  getExamDetail: ownerProcedure
    .input(z.object({ examId: z.string() }))
    .handler(async ({ context, input }) => {
      await assertActiveExam(context, input.examId);

      const exam = await context.db.exam.findFirst({
        where: {
          id: input.examId,
          batch: { clerkOrganizationId: context.organizationId },
        },
        select: {
          id: true,
          title: true,
          totalMarks: true,
          examDate: true,
          completedAt: true,
          batchId: true,
          batch: {
            select: {
              students: {
                where: { student: { archivedAt: null } },
                orderBy: { student: { fullName: "asc" } },
                select: {
                  student: {
                    select: { id: true, fullName: true, email: true },
                  },
                },
              },
            },
          },
          results: {
            select: { studentId: true, marks: true, remarks: true },
          },
        },
      });

      if (!exam) {
        throw new ORPCError("NOT_FOUND");
      }

      const { batch, ...rest } = exam;
      return {
        ...rest,
        students: batch.students.map((s) => s.student),
      };
    }),
  /**
   * Record marks for many students at once (the bulk grading workflow). Runs as
   * a single transaction so a saved sheet is all-or-nothing.
   */
  saveExamResults: ownerProcedure
    .input(
      z.object({
        examId: z.string(),
        results: z.array(
          z.object({
            studentId: z.string(),
            marks: z.number().min(0, "Marks must be 0 or more"),
            remarks: z.string().optional(),
          }),
        ),
        complete: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const exam = await assertActiveExam(context, input.examId);

      // A completed exam is locked: the only permitted action is reopening it
      // (complete === false). Any attempt to change marks is rejected.
      if (exam.completedAt && input.complete !== false) {
        throw new ORPCError("CONFLICT", {
          message: "This exam is completed. Reopen it before changing marks.",
        });
      }

      const overMax = input.results.find((r) => r.marks > exam.totalMarks);
      if (overMax) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Marks can't exceed the total of ${exam.totalMarks}`,
        });
      }

      // Every graded student must be an active member of this batch (archived
      // students can't be bulk-graded).
      const studentIds = input.results.map((r) => r.studentId);
      const members = await context.db.batchStudent.findMany({
        where: {
          batchId: exam.batchId,
          studentId: { in: studentIds },
          student: { archivedAt: null },
        },
        select: { studentId: true },
      });
      const memberIds = new Set(members.map((m) => m.studentId));
      const stranger = studentIds.find((id) => !memberIds.has(id));
      if (stranger) {
        throw new ORPCError("BAD_REQUEST", {
          message: "One or more students are not in this batch",
        });
      }

      await context.db.$transaction(async (tx) => {
        for (const record of input.results) {
          await tx.examResult.upsert({
            where: {
              examId_studentId: {
                examId: input.examId,
                studentId: record.studentId,
              },
            },
            create: {
              examId: input.examId,
              studentId: record.studentId,
              marks: record.marks,
              remarks: record.remarks,
            },
            update: {
              marks: record.marks,
              remarks: record.remarks,
            },
          });
        }

        if (input.complete !== undefined) {
          await tx.exam.update({
            where: { id: input.examId },
            data: { completedAt: input.complete ? new Date() : null },
          });
        }
      });

      return { count: input.results.length };
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
      const exam = await assertActiveExam(context, input.examId);

      if (input.marks < 0 || input.marks > exam.totalMarks) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Marks must be between 0 and ${exam.totalMarks}`,
        });
      }

      // The student must be an active member of this batch.
      const member = await context.db.batchStudent.findFirst({
        where: {
          batchId: exam.batchId,
          studentId: input.studentId,
          student: { archivedAt: null },
        },
      });
      if (!member) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Student is not an active member of this batch",
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
