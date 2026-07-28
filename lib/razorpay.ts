import "server-only";

import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "@/env";

/**
 * Lazily-created Razorpay SDK singleton. Instantiated on first use rather than
 * at module load, so importing this module (e.g. from the webhook, which only
 * needs the HMAC helpers below) never constructs the client — the SDK
 * constructor throws when keys are missing, which would otherwise break the
 * build's page-data collection. Only ever imported from server code — the
 * `server-only` guard makes a client import a build error.
 */
let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

/** Constant-time compare of two hex digests; false on any length mismatch. */
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify a Standard Checkout success callback: the client hands back the order
 * id, payment id and a signature that is `HMAC_SHA256(order_id + "|" +
 * payment_id, KEY_SECRET)`. This is a UX fast path — the webhook is still the
 * source of truth.
 */
export function verifyCheckoutSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/**
 * Verify a webhook delivery: `HMAC_SHA256(rawBody, WEBHOOK_SECRET)` must match
 * the `x-razorpay-signature` header. `rawBody` MUST be the exact bytes received
 * — parse JSON only after this passes.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}
