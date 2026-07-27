import { studentProcedure } from "@/orpc/orpc";
import { archivedError } from "@/orpc/router/owner/helpers";

/**
 * The current student's own profile row. Returns `null` (rather than throwing)
 * when the row doesn't exist yet, so the client gate can poll through webhook
 * lag without treating it as an error. Archived students throw the ARCHIVED
 * conflict so the gate can show the archived state.
 */
export const studentMeRouter = {
  get: studentProcedure.handler(async ({ context }) => {
    const student = await context.db.student.findUnique({
      where: {
        clerkOrganizationId_clerkUserId: {
          clerkOrganizationId: context.organizationId,
          clerkUserId: context.userId,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        archivedAt: true,
        createdAt: true,
      },
    });

    if (!student) return null;
    if (student.archivedAt) throw archivedError("student");

    return student;
  }),
};
