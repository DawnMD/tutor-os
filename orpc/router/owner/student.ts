import { getBaseUrl } from "@/lib/get-base-url";
import { ownerProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerStudentRouter = {
  getActiveStudentsByOrg: ownerProcedure.handler(async ({ context }) => {
    const users = await context.db.student.findMany({
      where: {
        clerkOrganizationId: context.organizationId,
        archivedAt: null,
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

    const data = users.map((student) => ({
      id: student.id,
      user_id: student.clerkUserId,
      name: student.fullName,
      email: student.email,
      joinedAt: student.createdAt,
      batches: student.batches.map((b) => ({
        id: b.batch.id,
        name: b.batch.name,
      })),
    }));

    return data;
  }),
  getPendingStudentsByOrg: ownerProcedure.handler(async ({ context }) => {
    const { data } =
      await context.clerk.organizations.getOrganizationInvitationList({
        organizationId: context.organizationId,
        status: ["pending", "revoked", "expired", "accepted"],
        limit: 100,
      });

    return data.map((invitation) => ({
      id: invitation.id,
      email: invitation.emailAddress,
      role: invitation.role,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    }));
  }),
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
      return await context.db.student.update({
        where: {
          clerkOrganizationId_clerkUserId: {
            clerkOrganizationId: context.organizationId,
            clerkUserId: input.studentId,
          },
        },
        data: {
          archivedAt: new Date(),
        },
      });
    }),
  revokeInvitation: ownerProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.clerk.organizations.revokeOrganizationInvitation({
        organizationId: context.organizationId,
        invitationId: input.invitationId,
      });
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
};
