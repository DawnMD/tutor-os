import { auth } from "@/lib/auth";
import { OrganizationRole, ownerProcedure } from "@/orpc/orpc";
import { assertActiveStudent } from "@/orpc/router/owner/helpers";
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
      return await auth.api.createInvitation({
        body: {
          email: input.email,
          role: OrganizationRole.STUDENT,
          organizationId: context.organizationId,
        },
        headers: context.headers,
      });
    }),
  getPendingInvitations: ownerProcedure.handler(async ({ context }) => {
    const invitations = await auth.api.listInvitations({
      query: { organizationId: context.organizationId },
      headers: context.headers,
    });

    const now = new Date();

    // Two filters Clerk's `status: ["pending"]` gave for free: the list
    // otherwise includes accepted/rejected/canceled, and nothing ever sweeps
    // expired rows, so they'd sit in the table as "pending" forever.
    return invitations
      .filter((inv) => inv.status === "pending" && inv.expiresAt > now)
      .map((inv) => ({
        id: inv.id,
        // Kept as `emailAddress` (Better Auth calls it `email`) so the pending
        // table and dashboard card don't have to change.
        emailAddress: inv.email,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      }));
  }),
  revokeInvitation: ownerProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await auth.api.cancelInvitation({
        body: { invitationId: input.invitationId },
        headers: context.headers,
      });

      return true;
    }),
  resendInvitation: ownerProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      // Single server procedure (not client-side revoke+create) so it can't
      // half-fail on the client and the email comes from the trusted record.
      // Read the row directly — `auth.api.getInvitation` is shaped for the
      // invitee, and this also scopes the lookup to the caller's organization.
      const existing = await context.db.invitation.findFirst({
        where: {
          id: input.invitationId,
          organizationId: context.organizationId,
        },
        select: { email: true },
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      // `resend: true` plus `cancelPendingInvitationsOnReInvite` replaces the
      // old revoke-then-recreate pair, so there's no window with no invitation.
      await auth.api.createInvitation({
        body: {
          email: existing.email,
          role: OrganizationRole.STUDENT,
          organizationId: context.organizationId,
          resend: true,
        },
        headers: context.headers,
      });

      return true;
    }),
  archieveStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const result = await context.db.student.updateMany({
        where: {
          id: input.studentId,
          organizationId: context.organizationId,
        },
        data: {
          archivedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new ORPCError("NOT_FOUND");
      }

      return true;
    }),
  unArchieveStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const result = await context.db.student.updateMany({
        where: {
          id: input.studentId,
          organizationId: context.organizationId,
        },
        data: {
          archivedAt: null,
        },
      });

      if (result.count === 0) {
        throw new ORPCError("NOT_FOUND");
      }

      return true;
    }),
  updateStudent: ownerProcedure
    .input(
      z.object({
        studentId: z.string(),
        // Trimmed + non-empty like every other name input: an empty string here
        // overwrites the name and renders blank in the places that don't fall
        // back to email.
        fullName: z.string().trim().min(1).optional(),
        phone: z.string().optional(),
        guardianName: z.string().optional(),
        guardianPhone: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { studentId, ...data } = input;

      await assertActiveStudent(context, studentId);

      const result = await context.db.student.updateMany({
        where: {
          id: studentId,
          organizationId: context.organizationId,
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

      await assertActiveStudent(context, studentId);

      // Ensure both batches belong to the active organization and are active
      // (neither the batch nor its class archived).
      const batches = await context.db.batch.findMany({
        where: {
          id: { in: [fromBatchId, toBatchId] },
          organizationId: context.organizationId,
          archivedAt: null,
          class: { archivedAt: null },
        },
        select: { id: true, classId: true },
      });

      const toBatch = batches.find((batch) => batch.id === toBatchId);
      const fromBatch = batches.find((batch) => batch.id === fromBatchId);

      if (!toBatch || !fromBatch) {
        throw new ORPCError("BAD_REQUEST");
      }

      // A "move" the student isn't part of is really an add — and it would
      // silently reset `joinedAt` (and with it, their outstanding dues) for a
      // batch they were never in. Make the caller's assumption explicit.
      const membership = await context.db.batchStudent.findFirst({
        where: { batchId: fromBatchId, studentId },
        select: { studentId: true },
      });
      if (!membership) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Student is not a member of the source batch",
        });
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

      await assertActiveStudent(context, studentId);

      // Ensure every batch belongs to the active organization and is active
      // (neither the batch nor its class archived).
      const batches = await context.db.batch.findMany({
        where: {
          id: {
            in: batchIds,
          },
          organizationId: context.organizationId,
          archivedAt: null,
          class: { archivedAt: null },
        },
        select: {
          id: true,
        },
      });

      if (batches.length !== batchIds.length) {
        throw new ORPCError("BAD_REQUEST");
      }

      // Diff rather than delete-all-then-recreate: `joinedAt` defaults to now()
      // and dues are computed from it, so recreating an unchanged membership
      // would silently wipe every outstanding month that student still owes.
      await context.db.$transaction(async (tx) => {
        // Scope the "current" set to exactly what the dialog can express:
        // active batches in this org. Memberships in archived batches (or under
        // archived classes) are invisible to the picker, so their absence from
        // `batchIds` isn't a request to remove them — dropping them would empty
        // a batch on restore, and reach across orgs while doing it.
        const current = await tx.batchStudent.findMany({
          where: {
            studentId,
            batch: {
              organizationId: context.organizationId,
              archivedAt: null,
              class: { archivedAt: null },
            },
          },
          select: { batchId: true },
        });

        const currentIds = new Set(current.map((row) => row.batchId));
        const selectedIds = new Set(batchIds);

        const toAdd = batchIds.filter((id) => !currentIds.has(id));
        const toRemove = current
          .map((row) => row.batchId)
          .filter((id) => !selectedIds.has(id));

        if (toAdd.length > 0) {
          await tx.batchStudent.createMany({
            data: toAdd.map((batchId) => ({
              batchId,
              studentId,
            })),
            skipDuplicates: true,
          });
        }

        if (toRemove.length > 0) {
          await tx.batchStudent.deleteMany({
            where: { studentId, batchId: { in: toRemove } },
          });
        }
      });

      return true;
    }),
  getAllStudents: ownerProcedure.handler(async ({ context }) => {
    return await context.db.student.findMany({
      where: {
        organizationId: context.organizationId,
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
