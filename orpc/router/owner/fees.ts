import { ownerProcedure } from "@/orpc/orpc";
import { assertActiveBatch } from "@/orpc/router/owner/helpers";
import {
  isPayablePeriod,
  isValidPeriod,
  monthEnd,
} from "@/lib/fee-periods";
import { ORPCError } from "@orpc/client";
import z from "zod";

const periodInput = {
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
};

export const ownerFeesRouter = {
  /**
   * Set (or clear) a batch's monthly fee. `null` disables fees for the batch —
   * no dues are computed and students can't create orders. Existing PAID rows
   * keep their snapshotted `amountPaise`, so history survives a fee change.
   */
  setBatchFee: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        monthlyFeePaise: z.number().int().min(0).nullable(),
      }),
    )
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

      return await context.db.batch.update({
        where: { id: input.batchId },
        data: { monthlyFeePaise: input.monthlyFeePaise },
        select: { id: true, monthlyFeePaise: true },
      });
    }),

  /**
   * Everything the batch Fees page needs for one period in a single round-trip:
   * the batch (with its fee + class name), its active roster with `joinedAt`,
   * and the FeePayment rows for that period. The client derives each student's
   * PAID / UNPAID / NOT_DUE state and the KPI totals — dues are never
   * materialized server-side.
   */
  getBatchFeesPage: ownerProcedure
    .input(z.object({ batchId: z.string(), ...periodInput }))
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
        },
        select: {
          id: true,
          name: true,
          classId: true,
          monthlyFeePaise: true,
          class: { select: { id: true, name: true } },
          students: {
            where: { student: { archivedAt: null } },
            orderBy: { student: { fullName: "asc" } },
            select: {
              joinedAt: true,
              student: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          feePayments: {
            where: {
              periodYear: input.year,
              periodMonth: input.month,
            },
            select: {
              id: true,
              studentId: true,
              status: true,
              method: true,
              amountPaise: true,
              paidAt: true,
              note: true,
              razorpayPaymentId: true,
            },
          },
        },
      });

      if (!batch) {
        throw new ORPCError("NOT_FOUND");
      }

      return batch;
    }),

  /**
   * Record a cash / offline-UPI payment for a student's month. The amount is
   * always taken from the batch's current fee (never client-supplied). Upserts
   * on the compound unique: a PAID row is a CONFLICT (already collected); a
   * PENDING row (an abandoned online attempt) is upgraded to PAID offline.
   */
  recordOfflinePayment: ownerProcedure
    .input(
      z.object({
        batchId: z.string(),
        studentId: z.string(),
        ...periodInput,
        method: z.enum(["CASH", "OFFLINE_UPI"]),
        note: z.string().trim().max(500).optional(),
        paidAt: z.coerce.date().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

      const period = { year: input.year, month: input.month };
      if (!isValidPeriod(period)) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid period" });
      }

      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
        },
        select: { monthlyFeePaise: true },
      });
      if (!batch) throw new ORPCError("NOT_FOUND");
      if (batch.monthlyFeePaise == null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "This batch has no monthly fee set.",
        });
      }

      // The student must be an active member of this batch.
      const member = await context.db.batchStudent.findFirst({
        where: {
          batchId: input.batchId,
          studentId: input.studentId,
          student: { archivedAt: null },
        },
        select: { joinedAt: true },
      });
      if (!member) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Student is not an active member of this batch",
        });
      }

      if (!isPayablePeriod(period)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Can't record a payment for a future month",
        });
      }
      if (member.joinedAt.getTime() > monthEnd(period.year, period.month).getTime()) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Student joined after this month",
        });
      }

      const existing = await context.db.feePayment.findUnique({
        where: {
          batchId_studentId_periodYear_periodMonth: {
            batchId: input.batchId,
            studentId: input.studentId,
            periodYear: period.year,
            periodMonth: period.month,
          },
        },
        select: { status: true },
      });
      if (existing?.status === "PAID") {
        throw new ORPCError("CONFLICT", {
          message: "This month is already paid.",
        });
      }

      const paidAt = input.paidAt ?? new Date();

      return await context.db.feePayment.upsert({
        where: {
          batchId_studentId_periodYear_periodMonth: {
            batchId: input.batchId,
            studentId: input.studentId,
            periodYear: period.year,
            periodMonth: period.month,
          },
        },
        create: {
          clerkOrganizationId: context.organizationId,
          batchId: input.batchId,
          studentId: input.studentId,
          periodYear: period.year,
          periodMonth: period.month,
          amountPaise: batch.monthlyFeePaise,
          status: "PAID",
          method: input.method,
          note: input.note,
          paidAt,
        },
        // Upgrade an abandoned online attempt (PENDING) to an offline PAID.
        // Refresh the amount snapshot to the current fee; keep any
        // `razorpayOrderId` so a late webhook still finds this row (already
        // PAID) and no-ops.
        update: {
          amountPaise: batch.monthlyFeePaise,
          status: "PAID",
          method: input.method,
          note: input.note,
          paidAt,
        },
        select: {
          id: true,
          studentId: true,
          status: true,
          method: true,
          amountPaise: true,
          paidAt: true,
        },
      });
    }),

  /**
   * Undo a manually-recorded payment. Only offline rows (CASH / OFFLINE_UPI)
   * are deletable — an ONLINE payment reflects real money captured by Razorpay
   * and is never removable here.
   */
  deleteOfflinePayment: ownerProcedure
    .input(z.object({ feePaymentId: z.string() }))
    .handler(async ({ context, input }) => {
      const payment = await context.db.feePayment.findFirst({
        where: {
          id: input.feePaymentId,
          clerkOrganizationId: context.organizationId,
        },
        select: { id: true, method: true },
      });
      if (!payment) throw new ORPCError("NOT_FOUND");
      if (payment.method === "ONLINE") {
        throw new ORPCError("CONFLICT", {
          message: "Online payments can't be undone here.",
        });
      }

      await context.db.feePayment.delete({ where: { id: payment.id } });
      return { id: payment.id };
    }),

  /**
   * Recent PAID payments for a batch across all periods (payment history),
   * newest first. Capped at 100.
   */
  listBatchPayments: ownerProcedure
    .input(z.object({ batchId: z.string() }))
    .handler(async ({ context, input }) => {
      await assertActiveBatch(context, input.batchId);

      return await context.db.feePayment.findMany({
        where: {
          batchId: input.batchId,
          clerkOrganizationId: context.organizationId,
          status: "PAID",
        },
        orderBy: { paidAt: "desc" },
        take: 100,
        select: {
          id: true,
          periodYear: true,
          periodMonth: true,
          amountPaise: true,
          method: true,
          paidAt: true,
          note: true,
          student: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
    }),
};
