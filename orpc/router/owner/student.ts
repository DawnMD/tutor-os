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
  unArchieveStudent: ownerProcedure
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
          archivedAt: null,
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
  getAllStudents: ownerProcedure.handler(async ({ context }) => {
    const [clerkUsers, dbUsers] = await Promise.all([
      context.clerk.organizations.getOrganizationInvitationList({
        organizationId: context.organizationId,
        status: ["pending", "accepted", "revoked", "expired"],
        limit: 100,
      }),
      context.db.student.findMany({
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
      }),
    ]);

    const studentMap = new Map(
      dbUsers.map((student) => [student.email.toLowerCase(), student]),
    );

    const merged = clerkUsers.data.map((invitation) => {
      const student = studentMap.get(invitation.emailAddress.toLowerCase());

      return {
        ...invitation,
        studentId: student?.id ?? null,
        clerkUserId: student?.clerkUserId ?? null,
        fullName: student?.fullName ?? null,
        phone: student?.phone ?? null,
        guardianName: student?.guardianName ?? null,
        guardianPhone: student?.guardianPhone ?? null,
        batches: student?.batches ?? [],
        joinedAt: student?.createdAt,
        archievedAt: student?.archivedAt ?? null,
        status: !!student?.archivedAt ? "archieved" : invitation.status,
      };
    });

    return merged;
  }),
};
