import "server-only";

import type { ReactElement } from "react";
import { Resend } from "resend";

import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send one transactional email.
 *
 * Throws on failure rather than swallowing: the callers that matter here are
 * Better Auth's `sendInvitationEmail` / `sendResetPassword`, and a silent
 * failure there leaves a tutor believing a student was invited. The invitation
 * row is written before the send, so "Resend invitation" recovers from it.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    react,
  });

  if (error) {
    console.error("[email] send failed", { to, subject, error });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
