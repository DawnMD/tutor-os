import { ownerProcedure } from "@/orpc/orpc";
import { assertNotPastDate } from "@/orpc/router/owner/helpers";
import { ORPCError } from "@orpc/client";
import * as z from "zod";

/**
 * Org-wide holidays. A holiday on a date cancels the template-derived class
 * chips of every batch that day (sessions/exams/overrides still render — those
 * are deliberately placed). Managed from the calendar; date carries date-only
 * semantics (client sends local-midnight, same convention as `classDate`).
 */
export const ownerHolidayRouter = {
  createHoliday: ownerProcedure
    .input(
      z.object({
        date: z.coerce.date(),
        name: z.string().trim().min(1, "Holiday name is required"),
      }),
    )
    .handler(async ({ context, input }) => {
      assertNotPastDate(input.date, { label: "Holiday date" });

      const existing = await context.db.holiday.findUnique({
        where: {
          clerkOrganizationId_date: {
            clerkOrganizationId: context.organizationId,
            date: input.date,
          },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ORPCError("BAD_REQUEST", {
          message: "A holiday already exists for that date",
        });
      }

      return await context.db.holiday.create({
        data: {
          clerkOrganizationId: context.organizationId,
          date: input.date,
          name: input.name,
        },
      });
    }),
  deleteHoliday: ownerProcedure
    .input(z.object({ holidayId: z.string() }))
    .handler(async ({ context, input }) => {
      const { count } = await context.db.holiday.deleteMany({
        where: {
          id: input.holidayId,
          clerkOrganizationId: context.organizationId,
        },
      });

      if (count === 0) throw new ORPCError("NOT_FOUND");

      return true;
    }),
};
