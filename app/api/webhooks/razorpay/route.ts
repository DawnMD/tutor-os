import { verifyWebhookSignature } from "@/lib/razorpay";
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

interface RazorpayPaymentEntity {
  id: string;
  order_id: string | null;
  amount: number;
}

interface RazorpayWebhookBody {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: { id: string } };
  };
}

async function markPaid(payment: RazorpayPaymentEntity) {
  const orderId = payment.order_id;
  if (!orderId) {
    console.warn("[razorpay webhook] payment without order_id", payment.id);
    return;
  }

  const row = await db.feePayment.findUnique({
    where: { razorpayOrderId: orderId },
    select: { id: true, status: true, amountPaise: true },
  });

  // Unknown order (e.g. an order we never persisted) — ack so Razorpay stops
  // retrying. Nothing to do.
  if (!row) {
    console.warn("[razorpay webhook] no FeePayment for order", orderId);
    return;
  }

  // Idempotent: a replayed webhook, or one that raced the checkout fast path.
  if (row.status === "PAID") {
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
        razorpayPaymentId: payment.id,
        paidAt: new Date(),
      },
    });
  } catch (err) {
    // Unique violation on razorpayPaymentId → this payment was already
    // processed (checkout fast path or a concurrent delivery). Safe to ignore.
    console.warn("[razorpay webhook] update skipped (already processed)", err);
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
          await markPaid(payment);
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
