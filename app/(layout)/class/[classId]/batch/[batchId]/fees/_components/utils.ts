import {
  comparePeriods,
  currentPeriod,
  FEE_TIMEZONE,
  type FeePeriod,
  monthEnd,
  monthStart,
} from "@/lib/fee-periods";
import { Outputs } from "@/orpc/router";

export type FeesPage = NonNullable<
  Outputs["owner"]["fees"]["getBatchFeesPage"]
>;

export type FeePaymentRow = FeesPage["feePayments"][number];

export type BatchPayment =
  Outputs["owner"]["fees"]["listBatchPayments"][number];

export type PaymentMethod = FeePaymentRow["method"];

/** Per-student state for a given month. */
export type RosterStatus = "PAID" | "UNPAID" | "NOT_DUE";

export interface RosterRow {
  studentId: string;
  fullName: string | null;
  email: string;
  joinedAt: Date;
  status: RosterStatus;
  /** Amount owed (current fee) or paid (snapshot), in paise. */
  amountPaise: number;
  /** The PAID/PENDING row for this student+period, if any. */
  payment: FeePaymentRow | null;
}

export interface FeesKpis {
  expectedPaise: number;
  collectedPaise: number;
  pendingPaise: number;
  paidCount: number;
  dueCount: number;
}

/** Human labels + badge styling per method. */
export const METHOD_META: Record<
  PaymentMethod,
  { label: string; short: string }
> = {
  ONLINE: { label: "Online", short: "Online" },
  CASH: { label: "Cash", short: "Cash" },
  OFFLINE_UPI: { label: "Offline UPI", short: "UPI" },
};

/** A payment recorded manually by the owner (undoable). */
export function isOfflineMethod(method: PaymentMethod): boolean {
  return method === "CASH" || method === "OFFLINE_UPI";
}

/** Long month label, e.g. "July 2026". */
export function periodLabel(period: FeePeriod): string {
  // monthStart is an IST-midnight instant; formatting it in the viewer's local
  // zone would render the *previous* month anywhere west of IST.
  return monthStart(period.year, period.month).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: FEE_TIMEZONE,
  });
}

/** Shift a period by ±1 month, rolling the year over. */
export function shiftPeriod(period: FeePeriod, delta: number): FeePeriod {
  const zeroBased = period.month - 1 + delta;
  const year = period.year + Math.floor(zeroBased / 12);
  const month = ((zeroBased % 12) + 12) % 12;
  return { year, month: month + 1 };
}

/** True when `period` is the current calendar month or later (no next-month). */
export function isAtOrAfterCurrent(period: FeePeriod, now = new Date()): boolean {
  return comparePeriods(period, currentPeriod(now)) >= 0;
}

/**
 * Derive each active student's PAID / UNPAID / NOT_DUE state for the given
 * period. A student is NOT_DUE if they joined after the month ended; otherwise
 * PAID if there's a PAID row, else UNPAID (which includes an abandoned PENDING
 * online attempt).
 */
export function buildRoster(
  batch: FeesPage,
  period: FeePeriod,
): RosterRow[] {
  const fee = batch.monthlyFeePaise ?? 0;
  const end = monthEnd(period.year, period.month).getTime();
  const byStudent = new Map(
    batch.feePayments.map((p) => [p.studentId, p]),
  );

  return batch.students.map((s) => {
    const joinedAt = new Date(s.joinedAt);
    const payment = byStudent.get(s.student.id) ?? null;

    let status: RosterStatus;
    if (joinedAt.getTime() > end) {
      status = "NOT_DUE";
    } else if (payment?.status === "PAID") {
      status = "PAID";
    } else {
      status = "UNPAID";
    }

    const amountPaise =
      payment?.status === "PAID" ? payment.amountPaise : fee;

    return {
      studentId: s.student.id,
      fullName: s.student.fullName,
      email: s.student.email,
      joinedAt,
      status,
      amountPaise,
      payment,
    };
  });
}

/** KPI totals for the period. Unpaid dues use the current fee; PAID rows use
 * their snapshot, so a mid-month fee change is reflected correctly. */
export function computeKpis(roster: RosterRow[], feePaise: number): FeesKpis {
  const due = roster.filter((r) => r.status !== "NOT_DUE");
  const paid = due.filter((r) => r.status === "PAID");
  const unpaidCount = due.length - paid.length;

  const collectedPaise = paid.reduce((sum, r) => sum + r.amountPaise, 0);
  const pendingPaise = unpaidCount * feePaise;

  return {
    expectedPaise: collectedPaise + pendingPaise,
    collectedPaise,
    pendingPaise,
    paidCount: paid.length,
    dueCount: due.length,
  };
}
