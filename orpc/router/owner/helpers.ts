import type { Context } from "@/orpc/context";
import { ORPCError } from "@orpc/client";

/**
 * Guard context: the subset of the owner-procedure context these helpers need.
 * `organizationId` is non-null once the owner middleware has run.
 */
type GuardContext = {
  db: Context["db"];
  organizationId: string;
};

type ArchivedScope = "batch" | "class" | "student";

const ARCHIVED_MESSAGES: Record<ArchivedScope, string> = {
  batch: "This batch is archived. Restore it before making changes.",
  class: "This batch's class is archived. Restore the class before making changes.",
  student: "This student is archived. Restore them before making changes.",
};

/**
 * A `CONFLICT` carrying `data.reason === "ARCHIVED"` — distinct from a plain
 * `NOT_FOUND` ("doesn't exist / not yours"). `scope` tells the UI which Restore
 * button to surface. Existing data-less `CONFLICT` uses (completed locks) don't
 * collide.
 */
export function archivedError(scope: ArchivedScope) {
  return new ORPCError("CONFLICT", {
    message: ARCHIVED_MESSAGES[scope],
    data: { reason: "ARCHIVED" as const, scope },
  });
}

const batchGuardSelect = {
  id: true,
  classId: true,
  archivedAt: true,
  class: { select: { id: true, archivedAt: true } },
} as const;

type GuardedBatch = {
  archivedAt: Date | null;
  class: { archivedAt: Date | null };
};

/** Effective-archive check: the parent class wins over the batch. */
function throwIfBatchArchived(batch: GuardedBatch) {
  if (batch.class.archivedAt) throw archivedError("class");
  if (batch.archivedAt) throw archivedError("batch");
}

/**
 * Fetch an org-owned batch (with its class-archive state). Throws NOT_FOUND if
 * it doesn't exist / isn't in the active org. Unless `allowArchived`, also
 * throws the ARCHIVED conflict (class-then-batch) via {@link throwIfBatchArchived}.
 */
export async function getOwnedBatch(
  ctx: GuardContext,
  batchId: string,
  opts: { allowArchived?: boolean } = {},
) {
  const batch = await ctx.db.batch.findFirst({
    where: { id: batchId, clerkOrganizationId: ctx.organizationId },
    select: batchGuardSelect,
  });

  if (!batch) throw new ORPCError("NOT_FOUND");
  if (!opts.allowArchived) throwIfBatchArchived(batch);

  return batch;
}

/** Assert the batch exists, is owned, and is not (effectively) archived. */
export const assertActiveBatch = (ctx: GuardContext, batchId: string) =>
  getOwnedBatch(ctx, batchId);

/**
 * Assert an org-owned session whose batch (and class) is active. Returns the
 * fields session/attendance call sites need (`batchId`, `completedAt`).
 */
export async function assertActiveSession(ctx: GuardContext, sessionId: string) {
  const session = await ctx.db.batchSession.findFirst({
    where: {
      id: sessionId,
      batch: { clerkOrganizationId: ctx.organizationId },
    },
    select: {
      id: true,
      batchId: true,
      completedAt: true,
      batch: { select: batchGuardSelect },
    },
  });

  if (!session) throw new ORPCError("NOT_FOUND");
  throwIfBatchArchived(session.batch);

  return session;
}

/**
 * Assert an org-owned exam whose batch (and class) is active. Returns the fields
 * exam guard call sites need (`batchId`, `totalMarks`, `completedAt`).
 */
export async function assertActiveExam(ctx: GuardContext, examId: string) {
  const exam = await ctx.db.exam.findFirst({
    where: {
      id: examId,
      batch: { clerkOrganizationId: ctx.organizationId },
    },
    select: {
      id: true,
      batchId: true,
      totalMarks: true,
      completedAt: true,
      batch: { select: batchGuardSelect },
    },
  });

  if (!exam) throw new ORPCError("NOT_FOUND");
  throwIfBatchArchived(exam.batch);

  return exam;
}

/**
 * Assert an org-owned schedule override whose batch (and class) is active.
 * Mirrors {@link assertActiveSession}. Returns the fields override call sites
 * need (`batchId`).
 */
export async function assertActiveOverride(
  ctx: GuardContext,
  overrideId: string,
) {
  const override = await ctx.db.scheduleOverride.findFirst({
    where: {
      id: overrideId,
      batch: { clerkOrganizationId: ctx.organizationId },
    },
    select: {
      id: true,
      batchId: true,
      batch: { select: batchGuardSelect },
    },
  });

  if (!override) throw new ORPCError("NOT_FOUND");
  throwIfBatchArchived(override.batch);

  return override;
}

/** Assert an org-owned student that is not archived. */
export async function assertActiveStudent(ctx: GuardContext, studentId: string) {
  const student = await ctx.db.student.findFirst({
    where: { id: studentId, clerkOrganizationId: ctx.organizationId },
    select: { id: true, archivedAt: true },
  });

  if (!student) throw new ORPCError("NOT_FOUND");
  if (student.archivedAt) throw archivedError("student");

  return student;
}

/** Assert an org-owned class that is not archived. */
export async function assertActiveClass(ctx: GuardContext, classId: string) {
  const cls = await ctx.db.class.findFirst({
    where: { id: classId, clerkOrganizationId: ctx.organizationId },
    select: { id: true, archivedAt: true },
  });

  if (!cls) throw new ORPCError("NOT_FOUND");
  if (cls.archivedAt) throw archivedError("class");

  return cls;
}

/**
 * Where-fragment for batch list queries: org-scoped and effectively active
 * (neither the batch nor its class archived).
 */
export const activeBatchWhere = (organizationId: string) =>
  ({
    clerkOrganizationId: organizationId,
    archivedAt: null,
    class: { archivedAt: null },
  }) as const;
