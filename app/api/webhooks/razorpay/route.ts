import { getRazorpay, verifyWebhookSignature } from "@/lib/razorpay";
import { db } from "@/prisma/db";
import { NextRequest } from "next/server";

/**
 * Razorpay webhook — the source of truth for marking a fee PAID. The student
 * checkout handler's signature verify is only a UX fast path; both converge on
 * the same idempotent update.
 *
 * Razorpay retries any non-2xx for up to 24h, so we return 200 for every
 * outcome we've handled — including unknown orders and already-paid rows — and
 * reserve non-2xx strictly for a failed signature check (400) or an unexpected
 * server error (500, to earn a retry).
 */

/** The notes we attach at order creation (see student/fees.ts createOrder). */
interface RazorpayOrderNotes {
  batchId?: string;
  studentId?: string;
  periodYear?: string;
  periodMonth?: string;
  clerkOrganizationId?: string;
}

interface RazorpayPaymentEntity {
  id: string;
  order_id: string | null;
  amount: number;
  notes?: RazorpayOrderNotes | null;
}

interface RazorpayWebhookBody {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: { id: string; notes?: RazorpayOrderNotes | null } };
  };
}

/** The compound-unique coordinates of a FeePayment row, parsed out of notes. */
interface NoteCoordinates {
  batchId: string;
  studentId: string;
  periodYear: number;
  periodMonth: number;
}

function parseNotes(
  notes: RazorpayOrderNotes | null | undefined,
): NoteCoordinates | null {
  if (!notes?.batchId || !notes.studentId) return null;

  const periodYear = Number(notes.periodYear);
  const periodMonth = Number(notes.periodMonth);
  if (!Number.isInteger(periodYear) || !Number.isInteger(periodMonth)) {
    return null;
  }

  return {
    batchId: notes.batchId,
    studentId: notes.studentId,
    periodYear,
    periodMonth,
  };
}

const rowSelect = {
  id: true,
  status: true,
  method: true,
  amountPaise: true,
  note: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
} as const;

/**
 * Find the FeePayment this capture belongs to.
 *
 * The order id is the fast path, but it is NOT reliable on its own: a student
 * who abandons checkout and retries gets a second order written over the first
 * on the same row, so a capture against the *first* order finds nothing. The
 * order notes carry the row's compound-unique coordinates, so fall back to
 * those — otherwise the money is captured and the fee stays unpaid forever
 * (Razorpay won't retry a 200, and we must return 200 to stop the retry storm).
 */
async function findRow(orderId: string, notes: RazorpayOrderNotes | null | undefined) {
  const byOrderId = await db.feePayment.findUnique({
    where: { razorpayOrderId: orderId },
    select: rowSelect,
  });
  if (byOrderId) return byOrderId;

  // The webhook payload doesn't always carry the order's notes (they're set on
  // the order, not the payment), so fetch the order when they're missing. A
  // failure here throws → 500 → Razorpay retries, which is what we want: the
  // alternative is acking a capture we couldn't place.
  let coordinates = parseNotes(notes);
  if (!coordinates) {
    const order = await getRazorpay().orders.fetch(orderId);
    coordinates = parseNotes(order?.notes as RazorpayOrderNotes | undefined);
  }

  if (!coordinates) return null;

  console.warn(
    `[razorpay webhook] order ${orderId} not on any row — resolved via notes (superseded by a retry?)`,
  );

  return await db.feePayment.findUnique({
    where: {
      batchId_studentId_periodYear_periodMonth: {
        batchId: coordinates.batchId,
        studentId: coordinates.studentId,
        periodYear: coordinates.periodYear,
        periodMonth: coordinates.periodMonth,
      },
    },
    select: rowSelect,
  });
}

/** Marker appended to `note` so a collision is visible in the owner's Fees UI. */
const RECONCILE_MARKER = "[needs reconciliation]";

function withReconcileNote(existing: string | null, detail: string): string {
  const line = `${RECONCILE_MARKER} ${detail}`;
  if (existing?.includes(RECONCILE_MARKER)) return existing;
  return existing ? `${existing}\n${line}` : line;
}

async function markPaid(
  payment: RazorpayPaymentEntity,
  orderNotes?: RazorpayOrderNotes | null,
) {
  const orderId = payment.order_id;
  if (!orderId) {
    console.warn("[razorpay webhook] payment without order_id", payment.id);
    return;
  }

  const row = await findRow(orderId, payment.notes ?? orderNotes);

  // Genuinely not ours (an order we never persisted, or one whose row was
  // deleted) — ack so Razorpay stops retrying. Nothing to do.
  if (!row) {
    console.warn("[razorpay webhook] no FeePayment for order", orderId);
    return;
  }

  if (row.status === "PAID") {
    // An offline record was written over a PENDING online attempt, and the
    // online attempt then captured anyway: real money is sitting in Razorpay
    // while the books say cash. Never silently swallow this.
    if (row.method !== "ONLINE" && !row.razorpayPaymentId) {
      console.error(
        `[razorpay webhook] RECONCILE: order ${orderId} captured ${payment.amount} paise (payment ${payment.id}) but FeePayment ${row.id} is already PAID as ${row.method}. The online payment must be refunded or the offline record corrected.`,
      );
      await db.feePayment.update({
        where: { id: row.id },
        data: {
          note: withReconcileNote(
            row.note,
            `Online payment ${payment.id} was captured after this was recorded as ${row.method}. Refund or correct.`,
          ),
        },
      });
      return;
    }

    // Two distinct captures against the same month — the student paid twice
    // (e.g. completed both an abandoned and a retried checkout window).
    if (row.razorpayPaymentId && row.razorpayPaymentId !== payment.id) {
      console.error(
        `[razorpay webhook] RECONCILE: duplicate capture for FeePayment ${row.id} — already recorded ${row.razorpayPaymentId}, now ${payment.id} (${payment.amount} paise). One needs refunding.`,
      );
      await db.feePayment.update({
        where: { id: row.id },
        data: {
          note: withReconcileNote(
            row.note,
            `Duplicate online capture ${payment.id}; ${row.razorpayPaymentId} already recorded. One needs refunding.`,
          ),
        },
      });
      return;
    }

    // Idempotent: a replayed webhook, or one that raced the checkout fast path.
    return;
  }

  // Defense-in-depth: the amount is set server-side at order creation, so a
  // mismatch shouldn't happen. Log it (manual review) but still mark paid —
  // money was captured.
  if (payment.amount !== row.amountPaise) {
    console.warn(
      `[razorpay webhook] amount mismatch for order ${orderId}: captured ${payment.amount} vs expected ${row.amountPaise}`,
    );
  }

  try {
    await db.feePayment.update({
      where: { id: row.id },
      data: {
        status: "PAID",
        method: "ONLINE",
        razorpayOrderId: orderId,
        razorpayPaymentId: payment.id,
        paidAt: new Date(),
      },
    });
  } catch (err) {
    // Usually a unique violation on razorpayPaymentId: the checkout fast path
    // or a concurrent delivery already recorded this payment. Confirm that's
    // what happened rather than assuming it — swallowing a genuine write
    // failure would ack a real capture against a still-PENDING row, and
    // Razorpay never retries a 200.
    const after = await db.feePayment.findUnique({
      where: { id: row.id },
      select: { status: true },
    });
    if (after?.status === "PAID") {
      console.warn("[razorpay webhook] update skipped (already processed)", err);
      return;
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  // Read the raw bytes BEFORE any JSON parse — the HMAC is over the exact body.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const body = JSON.parse(rawBody) as RazorpayWebhookBody;

    switch (body.event) {
      case "payment.captured":
      case "order.paid": {
        const payment = body.payload?.payment?.entity;
        if (payment) {
          // `order.paid` carries the order entity too — its notes save us an
          // API round-trip when the order id lookup misses.
          await markPaid(payment, body.payload?.order?.entity?.notes);
        } else {
          console.warn(
            "[razorpay webhook] event without payment entity",
            body.event,
          );
        }
        break;
      }
      default:
        // Not an event we act on — ack it.
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    // Unexpected failure — return 500 so Razorpay retries the delivery.
    console.error("[razorpay webhook] handler error", err);
    return new Response("Webhook handler error", { status: 500 });
  }
}
