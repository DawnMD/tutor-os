import { ownerProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import z from "zod";

export const ownerClassRouter = {
  createClass: ownerProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.class.create({
        data: {
          name: input.name,
          clerkOrganizationId: context.organizationId,
          description: input.description,
        },
      });
    }),
  archieveClass: ownerProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      // Org-scoped updateMany so a cross-org id can't be archived.
      const result = await context.db.class.updateMany({
        where: {
          id: input.id,
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
  unArchieveClass: ownerProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const result = await context.db.class.updateMany({
        where: {
          id: input.id,
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
  getAllClass: ownerProcedure.handler(async ({ context }) => {
    const classes = await context.db.class.findMany({
      where: {
        clerkOrganizationId: context.organizationId,
      },
      include: {
        batches: {
          select: {
            id: true,
            name: true,
            color: true,
            students: {
              select: {
                studentId: true,
              },
            },
          },
        },
      },
    });

    return classes.map((cls) => ({
      ...cls,
      studentCount: new Set(
        cls.batches.flatMap((b) => b.students.map((s) => s.studentId)),
      ).size,
    }));
  }),
};
