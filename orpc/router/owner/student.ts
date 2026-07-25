import { getBaseUrl } from "@/lib/get-base-url";
import { ownerProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerStudentRouter = {
  addStundent: ownerProcedure
    .input(
      z.object({
        email: z.email(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.clerk.organizations.createOrganizationInvitation({
        redirectUrl: `${getBaseUrl()}/accept-invitation`,
        emailAddress: input.email,
        organizationId: context.organizationId,
        role: "org:member",
      });
    }),
  archieveStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.student.updateMany({
        where: {
          id: input.studentId,
          clerkOrganizationId: context.organizationId,
        },
        data: {
          archivedAt: new Date(),
        },
      });
    }),
  unArchieveStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.student.updateMany({
        where: {
          id: input.studentId,
          clerkOrganizationId: context.organizationId,
        },
        data: {
          archivedAt: null,
        },
      });
    }),
  updateStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        guardianName: z.string().optional(),
        guardianPhone: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { studentId, ...data } = input;

      const result = await context.db.student.updateMany({
        where: {
          id: studentId,
          clerkOrganizationId: context.organizationId,
        },
        data,
      });

      if (result.count === 0) {
        throw new ORPCError("NOT_FOUND");
      }

      return true;
    }),
  moveStudentToBatch: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
        fromBatchId: z.string(),
        toBatchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { studentId, fromBatchId, toBatchId } = input;

      // Ensure the student belongs to the active organization
      const student = await context.db.student.findFirst({
        where: {
          id: studentId,
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      });

      if (!student) {
        throw new ORPCError("NOT_FOUND");
      }

      // Ensure both batches belong to the active organization
      const batches = await context.db.batch.findMany({
        where: {
          id: { in: [fromBatchId, toBatchId] },
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: { id: true, classId: true },
      });

      const toBatch = batches.find((batch) => batch.id === toBatchId);
      const fromBatch = batches.find((batch) => batch.id === fromBatchId);

      if (!toBatch || !fromBatch) {
        throw new ORPCError("BAD_REQUEST");
      }

      await context.db.$transaction(async (tx) => {
        await tx.batchStudent.deleteMany({
          where: {
            batchId: fromBatchId,
            studentId,
          },
        });

        await tx.batchStudent.createMany({
          data: [{ batchId: toBatchId, studentId }],
          skipDuplicates: true,
        });
      });

      return { classId: toBatch.classId };
    }),
  addStudentToBatches: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
        batchIds: z.array(z.string()),
      }),
    )
    .handler(async ({ context, input }) => {
      const { studentId, batchIds } = input;

      // Ensure the student belongs to the active organization
      const student = await context.db.student.findFirst({
        where: {
          id: studentId,
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!student) {
        throw new ORPCError("NOT_FOUND");
      }

      // Ensure every batch belongs to the active organization
      const batches = await context.db.batch.findMany({
        where: {
          id: {
            in: batchIds,
          },
          clerkOrganizationId: context.organizationId,
          archivedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (batches.length !== batchIds.length) {
        throw new ORPCError("BAD_REQUEST");
      }

      await context.db.$transaction(async (tx) => {
        // Remove existing assignments
        await tx.batchStudent.deleteMany({
          where: {
            studentId,
          },
        });

        // Insert new assignments
        if (batchIds.length > 0) {
          await tx.batchStudent.createMany({
            data: batchIds.map((batchId) => ({
              batchId,
              studentId,
            })),
            skipDuplicates: true,
          });
        }
      });

      return true;
    }),
  getAllStudents: ownerProcedure.handler(async ({ context }) => {
    return await context.db.student.findMany({
      where: {
        clerkOrganizationId: context.organizationId,
      },
      include: {
        batches: {
          select: {
            batch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });
  }),
};
