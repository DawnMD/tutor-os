import { ownerProcedure } from "@/orpc/orpc";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const batchStudentRouter = {
  getStudentsByBatch: ownerProcedure
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
        select: {
          classId: true,
          id: true,
          students: {
            where: {
              student: {
                archivedAt: null,
              },
            },
            orderBy: {
              student: {
                fullName: "asc",
              },
            },
            select: {
              joinedAt: true,

              student: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  guardianName: true,
                  guardianPhone: true,
                },
              },
            },
          },
        },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return batch.students.map((item) => ({
        ...item.student,
        joinedAt: item.joinedAt,
        batchId: batch.id,
        classId: batch.classId,
      }));
    }),
  getStudentDashboard: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        studentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const student = await context.db.student.findFirst({
        where: {
          id: input.studentId,
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
          batches: {
            some: {
              batchId: input.batchId,
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          guardianName: true,
          guardianPhone: true,
          createdAt: true,

          batches: {
            where: {
              batchId: input.batchId,
            },
            select: {
              joinedAt: true,
              batch: {
                select: {
                  id: true,
                  name: true,
                  class: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },

          attendance: {
            where: {
              session: {
                batchId: input.batchId,
              },
            },
            orderBy: {
              session: {
                classDate: "desc",
              },
            },
            select: {
              status: true,
              remarks: true,
              session: {
                select: {
                  id: true,
                  classDate: true,
                  topic: true,
                  summary: true,
                },
              },
            },
          },

          examResults: {
            where: {
              exam: {
                batchId: input.batchId,
              },
            },
            orderBy: {
              exam: {
                examDate: "desc",
              },
            },
            select: {
              marks: true,
              remarks: true,
              exam: {
                select: {
                  id: true,
                  title: true,
                  examDate: true,
                  totalMarks: true,
                },
              },
            },
          },
        },
      });

      if (!student) {
        throw new ORPCError("NOT_FOUND");
      }

      // Upcoming exams for the batch (not yet taken / in the future),
      // scoped to this batch only.
      const now = new Date();
      const takenExamIds = new Set(student.examResults.map((r) => r.exam.id));
      const upcomingExams = (
        await context.db.exam.findMany({
          where: {
            batchId: input.batchId,
            examDate: { gte: now },
          },
          orderBy: { examDate: "asc" },
          select: {
            id: true,
            title: true,
            examDate: true,
            totalMarks: true,
          },
        })
      ).filter((exam) => !takenExamIds.has(exam.id));

      const attendanceSummary = {
        total: student.attendance.length,
        present: student.attendance.filter(
          (a) => a.status === AttendanceStatus.PRESENT,
        ).length,
        absent: student.attendance.filter(
          (a) => a.status === AttendanceStatus.ABSENT,
        ).length,
        late: student.attendance.filter(
          (a) => a.status === AttendanceStatus.LATE,
        ).length,
      };

      return {
        ...student,
        attendanceSummary: {
          ...attendanceSummary,
          percentage:
            attendanceSummary.total === 0
              ? 0
              : Math.round(
                  (attendanceSummary.present / attendanceSummary.total) * 100,
                ),
        },
        latestExam: student.examResults[0] ?? null,
        upcomingExams,
        nextExam: upcomingExams[0] ?? null,
      };
    }),
};
