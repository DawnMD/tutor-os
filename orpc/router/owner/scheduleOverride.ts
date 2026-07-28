import { ownerProcedure } from "@/orpc/orpc";
import {
  assertActiveBatch,
  assertActiveOverride,
  assertNotPastDate,
} from "@/orpc/router/owner/helpers";
import { ORPCError } from "@orpc/client";
import * as z from "zod";

const minutes = z.number().int().min(0).max(1440);

/**
 * Schedule overrides: MOVED (one template occurrence on `date` shifted to
 * `newDate` + new time) and EXTRA (a standalone makeup/extra class on `date`).
 * Neither touches `BatchSession`, so attendance math is unaffected. When a
 * moved/extra class is actually conducted, the owner logs a normal session on
 * that date — the session then wins over the override chip.
 *
 * Past dates are blocked: strict day-level enforcement lives client-side, with
 * a lenient 48h server guard here (see `lib/dates.ts` for the convention).
 */
export const ownerScheduleOverrideRouter = {
  createOverride: ownerProcedure
    .input(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("MOVED"),
          batchId: z.string(),
          date: z.coerce.date(),
          newDate: z.coerce.date(),
          startMinutes: minutes,
          endMinutes: minutes,
          reason: z.string().trim().min(1).optional(),
        }),
        z.object({
          type: z.literal("EXTRA"),
          batchId: z.string(),
          date: z.coerce.date(),
          startMinutes: minutes,
          endMinutes: minutes,
          reason: z.string().trim().min(1).optional(),
        }),
      ]),
    )
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);
      assertNotPastDate(input.date, { label: "Class date" });
      if (input.type === "MOVED") {
        assertNotPastDate(input.newDate, { label: "New date" });
      }

      if (input.endMinutes <= input.startMinutes) {
        throw new ORPCError("BAD_REQUEST", {
          message: "End time must be after the start time",
        });
      }

      // Guard the [batchId, date, type] unique constraint up front for a
      // friendly message. (Server never does day-equality math — the client
      // sends local-midnight dates; see calendar date convention.)
      const existing = await context.db.scheduleOverride.findUnique({
        where: {
          batchId_date_type: {
            batchId: input.batchId,
            date: input.date,
            type: input.type,
          },
        },
        select: { id: true },
      });

      if (existing) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            input.type === "MOVED"
              ? "This class has already been rescheduled for that day"
              : "An extra class already exists for that day",
        });
      }

      return await context.db.scheduleOverride.create({
        data: {
          batchId: input.batchId,
          type: input.type,
          date: input.date,
          newDate: input.type === "MOVED" ? input.newDate : null,
          startMinutes: input.startMinutes,
          endMinutes: input.endMinutes,
          reason: input.reason ?? null,
        },
      });
    }),
  deleteOverride: ownerProcedure
    .input(z.object({ overrideId: z.string() }))
    .handler(async ({ context, input }) => {
      await assertActiveOverride(context, input.overrideId);

      await context.db.scheduleOverride.delete({
        where: { id: input.overrideId },
      });

      return true;
    }),
};
