import { studentProcedure } from "@/orpc/orpc";
import {
  getCurrentStudent,
  getEnrolledBatch,
} from "@/orpc/router/student/helpers";
import {
  duePeriodsSince,
  isPayablePeriod,
  isValidPeriod,
  monthEnd,
  periodKey,
} from "@/lib/fee-periods";
import {
  getRazorpay,
  verifyCheckoutSignature,
} from "@/lib/razorpay";
import { ORPCError } from "@orpc/client";
import * as z from "zod";

const periodInput = {
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
};

export const studentFeesRouter = {
  /**
   * The current student's outstanding dues across every enrolled, active batch
   * that has a monthly fee set. Dues are computed from the join month to now
   * (see {@link duePeriodsSince}) minus any month already covered by a PAID row.
   * PENDING rows (abandoned online attempts) still count as owed — the student
   * can retry them.
   */
  myDues: studentProcedure.handler(async ({ context }) => {
    const student = await getCurrentStudent(context);
    const now = new Date();

    const batches = await context.db.batch.findMany({
      where: {
        clerkOrganizationId: context.organizationId,
        archivedAt: null,
        class: { archivedAt: null },
        monthlyFeePaise: { not: null },
        students: { some: { studentId: student.id } },
      },
      select: {
        id: true,
        name: true,
        classId: true,
        monthlyFeePaise: true,
        class: { select: { name: true } },
        students: {
          where: { studentId: student.id },
          select: { joinedAt: true },
        },
        feePayments: {
          where: { studentId: student.id, status: "PAID" },
          select: { periodYear: true, periodMonth: true },
        },
      },
    });

    return batches.map((batch) => {
      const amountPaise = batch.monthlyFeePaise ?? 0;
      const joinedAt = batch.students[0]?.joinedAt ?? now;
      const paidKeys = new Set(
        batch.feePayments.map((p) =>
          periodKey({ year: p.periodYear, month: p.periodMonth }),
        ),
      );

      const dues = duePeriodsSince(joinedAt, now)
        .filter((period) => !paidKeys.has(periodKey(period)))
        .map((period) => ({
          year: period.year,
          month: period.month,
          amountPaise,
        }));

      return {
        batchId: batch.id,
        batchName: batch.name,
        classId: batch.classId,
        className: batch.class.name,
        dues,
      };
    });
  }),

  /**
   * Start an online payment for one month. Creates a Razorpay order with the
   * amount taken from the server-side batch fee (never the client), then upserts
   * the FeePayment as PENDING/ONLINE with the order id. Retrying an abandoned
   * month overwrites the stale order id and refreshes the amount snapshot.
   */
  createOrder: studentProcedure
    .input(z.object({ batchId: z.string(), ...periodInput }))
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);
      // Guards existence + enrollment + not-archived.
      await getEnrolledBatch(context, student.id, input.batchId);

      const period = { year: input.year, month: input.month };
      if (!isValidPeriod(period)) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid period" });
      }

      const batch = await context.db.batch.findFirst({
        where: {
          id: input.batchId,
          clerkOrganizationId: context.organizationId,
          students: { some: { studentId: student.id } },
        },
        select: {
          monthlyFeePaise: true,
          students: {
            where: { studentId: student.id },
            select: { joinedAt: true },
          },
        },
      });

      if (!batch || batch.monthlyFeePaise == null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "This batch has no monthly fee set.",
        });
      }
      if (!isPayablePeriod(period)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "This month isn't payable yet.",
        });
      }
      const joinedAt = batch.students[0]?.joinedAt;
      if (
        !joinedAt ||
        joinedAt.getTime() > monthEnd(period.year, period.month).getTime()
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No fee is due for this month.",
        });
      }

      const compoundWhere = {
        batchId_studentId_periodYear_periodMonth: {
          batchId: input.batchId,
          studentId: student.id,
          periodYear: period.year,
          periodMonth: period.month,
        },
      };

      const existing = await context.db.feePayment.findUnique({
        where: compoundWhere,
        select: { status: true },
      });
      if (existing?.status === "PAID") {
        throw new ORPCError("CONFLICT", {
          message: "This month is already paid.",
        });
      }

      const amountPaise = batch.monthlyFeePaise;
      const order = await getRazorpay().orders.create({
        amount: amountPaise,
        currency: "INR",
        notes: {
          batchId: input.batchId,
          studentId: student.id,
          periodYear: String(period.year),
          periodMonth: String(period.month),
          clerkOrganizationId: context.organizationId,
        },
      });

      await context.db.feePayment.upsert({
        where: compoundWhere,
        create: {
          clerkOrganizationId: context.organizationId,
          batchId: input.batchId,
          studentId: student.id,
          periodYear: period.year,
          periodMonth: period.month,
          amountPaise,
          status: "PENDING",
          method: "ONLINE",
          razorpayOrderId: order.id,
        },
        update: {
          amountPaise,
          status: "PENDING",
          method: "ONLINE",
          razorpayOrderId: order.id,
        },
      });

      return { orderId: order.id, amountPaise };
    }),

  /**
   * Checkout success fast path (the webhook is the source of truth). The row is
   * looked up by order id AND the current student, so one student can never
   * confirm another's payment. A valid signature marks the row PAID; an
   * already-PAID row means the webhook won the race — still a success.
   */
  verifyPayment: studentProcedure
    .input(
      z.object({
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const student = await getCurrentStudent(context);

      const row = await context.db.feePayment.findFirst({
        where: {
          razorpayOrderId: input.razorpayOrderId,
          studentId: student.id,
        },
        select: { id: true, status: true },
      });
      if (!row) throw new ORPCError("NOT_FOUND");

      const valid = verifyCheckoutSignature({
        orderId: input.razorpayOrderId,
        paymentId: input.razorpayPaymentId,
        signature: input.razorpaySignature,
      });
      if (!valid) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Payment signature verification failed.",
        });
      }

      if (row.status === "PAID") {
        return { status: "PAID" as const };
      }

      try {
        await context.db.feePayment.update({
          where: { id: row.id },
          data: {
            status: "PAID",
            razorpayPaymentId: input.razorpayPaymentId,
            paidAt: new Date(),
          },
        });
      } catch {
        // The webhook may have landed and set the same razorpayPaymentId
        // between our read and write — the row is PAID either way.
      }

      return { status: "PAID" as const };
    }),

  /**
   * The current student's own PAID payments, newest first, with batch + class
   * names for display. Capped at 100.
   */
  myPayments: studentProcedure.handler(async ({ context }) => {
    const student = await getCurrentStudent(context);

    return await context.db.feePayment.findMany({
      where: { studentId: student.id, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 100,
      select: {
        id: true,
        periodYear: true,
        periodMonth: true,
        amountPaise: true,
        method: true,
        paidAt: true,
        batch: {
          select: {
            id: true,
            name: true,
            class: { select: { name: true } },
          },
        },
      },
    });
  }),
};
