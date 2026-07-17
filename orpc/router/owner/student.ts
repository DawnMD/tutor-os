import { ownerProcedure } from "@/orpc/orpc";

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
      name: student.fullName,
      email: student.email,
      joinedAt: student.createdAt,
      status: "ACTIVE" as const,
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
};
