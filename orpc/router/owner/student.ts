import { getBaseUrl } from "@/lib/get-base-url";
import { ownerProcedure } from "@/orpc/orpc";
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
      id: student.clerkUserId,
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
        status: ["pending"],
        limit: 50,
      });

    return data.map((invitation) => ({
      id: invitation.id,
      email: invitation.emailAddress,
      role: invitation.role,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
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
  deleteStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.clerk.organizations.deleteOrganizationMembership({
        organizationId: context.organizationId,
        userId: input.studentId,
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
};
