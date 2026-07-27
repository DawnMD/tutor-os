import type { Context } from "@/orpc/context";
import { archivedError } from "@/orpc/router/owner/helpers";
import { ORPCError } from "@orpc/client";

/**
 * Guard context: the subset of the student-procedure context these helpers
 * need. `organizationId` and `userId` are non-null once the org + auth
 * middleware has run.
 */
type GuardContext = {
  db: Context["db"];
  organizationId: string;
  userId: string;
};

/**
 * Resolve the DB `Student` for the current request from the active org +
 * signed-in user — NEVER from a client-supplied id. Throws NOT_FOUND if the
 * webhook hasn't created the row yet, or the ARCHIVED conflict if the tutor
 * has archived them.
 */
export async function getCurrentStudent(ctx: GuardContext) {
  const student = await ctx.db.student.findUnique({
    where: {
      clerkOrganizationId_clerkUserId: {
        clerkOrganizationId: ctx.organizationId,
        clerkUserId: ctx.userId,
      },
    },
    select: { id: true, archivedAt: true },
  });

  if (!student) throw new ORPCError("NOT_FOUND");
  if (student.archivedAt) throw archivedError("student");

  return student;
}

/**
 * Where-fragment for the student's enrolled batch queries: org-scoped,
 * effectively active (neither the batch nor its class archived) AND the student
 * is enrolled. Mirror of the owner `activeBatchWhere`, plus the enrollment
 * scope so a student can never see a batch they aren't in.
 */
export const enrolledActiveBatchWhere = (
  organizationId: string,
  studentId: string,
) =>
  ({
    clerkOrganizationId: organizationId,
    archivedAt: null,
    class: { archivedAt: null },
    students: { some: { studentId } },
  }) as const;

/**
 * Assert a batch the current student is enrolled in, exists, is org-owned, and
 * is not (effectively) archived. NOT_FOUND if it doesn't exist / isn't in the
 * active org / the student isn't enrolled — no name leak in any of those cases.
 * Archived errors are class-then-batch, matching the owner semantics.
 */
export async function getEnrolledBatch(
  ctx: GuardContext,
  studentId: string,
  batchId: string,
) {
  const batch = await ctx.db.batch.findFirst({
    where: {
      id: batchId,
      clerkOrganizationId: ctx.organizationId,
      students: { some: { studentId } },
    },
    select: {
      id: true,
      classId: true,
      archivedAt: true,
      class: { select: { id: true, archivedAt: true } },
    },
  });

  if (!batch) throw new ORPCError("NOT_FOUND");
  if (batch.class.archivedAt) throw archivedError("class");
  if (batch.archivedAt) throw archivedError("batch");

  return batch;
}
