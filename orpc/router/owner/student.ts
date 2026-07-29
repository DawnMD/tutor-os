import { getBaseUrl } from "@/lib/get-base-url";
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
      return await context.clerk.organizations.createOrganizationInvitation({
        redirectUrl: `${getBaseUrl()}/accept-invitation`,
        emailAddress: input.email,
        organizationId: context.organizationId,
        role: OrganizationRole.STUDENT,
      });
    }),
  getPendingInvitations: ownerProcedure.handler(async ({ context }) => {
    const { data } =
      await context.clerk.organizations.getOrganizationInvitationList({
        organizationId: context.organizationId,
        status: ["pending"], // list otherwise includes accepted/revoked
        limit: 500, // Clerk default page size is 10; 500 is the max
      });

    // Whitelist plain fields — raw OrganizationInvitation includes
    // privateMetadata/url which must not leak over RPC.
    return data.map((inv) => ({
      id: inv.id,
      emailAddress: inv.emailAddress,
      status: inv.status,
      createdAt: inv.createdAt, // unix ms number
      expiresAt: inv.expiresAt, // unix ms number
    }));
  }),
  revokeInvitation: ownerProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.clerk.organizations.revokeOrganizationInvitation({
        organizationId: context.organizationId,
        invitationId: input.invitationId,
        requestingUserId: context.userId,
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
      const existing =
        await context.clerk.organizations.getOrganizationInvitation({
          organizationId: context.organizationId,
          invitationId: input.invitationId,
        });

      await context.clerk.organizations.revokeOrganizationInvitation({
        organizationId: context.organizationId,
        invitationId: input.invitationId,
        requestingUserId: context.userId,
      });

      await context.clerk.organizations.createOrganizationInvitation({
        redirectUrl: `${getBaseUrl()}/accept-invitation`,
        emailAddress: existing.emailAddress,
        organizationId: context.organizationId,
        role: OrganizationRole.STUDENT,
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
          clerkOrganizationId: context.organizationId,
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
          clerkOrganizationId: context.organizationId,
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

      await assertActiveStudent(context, studentId);

      // Ensure both batches belong to the active organization and are active
      // (neither the batch nor its class archived).
      const batches = await context.db.batch.findMany({
        where: {
          id: { in: [fromBatchId, toBatchId] },
          clerkOrganizationId: context.organizationId,
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
          clerkOrganizationId: context.organizationId,
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
              clerkOrganizationId: context.organizationId,
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
