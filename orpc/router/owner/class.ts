import { ownerProcedure } from "@/orpc/orpc";
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
      return await context.db.class.update({
        where: {
          id: input.id,
        },
        data: {
          archivedAt: new Date(),
        },
      });
    }),
  unArchieveClass: ownerProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.class.update({
        where: {
          id: input.id,
        },
        data: {
          archivedAt: null,
        },
      });
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
