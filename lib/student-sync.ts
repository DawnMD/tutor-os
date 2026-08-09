import "server-only";

import { db } from "@/prisma/db";

/**
 * Mirrors organization membership into the `Student` table.
 *
 * These used to be driven by a Clerk webhook (`organizationMembership.*`).
 * Membership now lives in our own database, so they run in-process from the
 * organization plugin's hooks — which means the `Student` row exists before the
 * student's browser has finished the redirect, and the eventual-consistency
 * window the old client gate polled through is gone.
 */

export async function mirrorStudentMembership({
  organizationId,
  userId,
  name,
  email,
}: {
  organizationId: string;
  userId: string;
  name?: string | null;
  email: string;
}) {
  await db.student.upsert({
    where: { organizationId_userId: { organizationId, userId } },
    update: {
      fullName: name?.trim() || undefined,
      email,
      // Re-adding a previously removed member restores them (removal archives
      // rather than deletes, so their history is still here).
      archivedAt: null,
    },
    create: {
      organizationId,
      userId,
      fullName: name?.trim() || null,
      email,
    },
  });
}

/**
 * Archive rather than delete. `Student` cascades to FeePayment,
 * AttendanceRecord and ExamResult, so a hard delete would destroy the tutor's
 * entire payment and attendance history for that student the moment a
 * membership is removed. `updateMany` is also idempotent: no row matches for an
 * owner membership (we never create one) or a repeated hook invocation, where
 * `delete` would throw P2025.
 */
export async function archiveStudentMembership({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  await db.student.updateMany({
    where: { organizationId, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
}
