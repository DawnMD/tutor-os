import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { env } from "@/env";
import { OrganizationInvitationEmail } from "@/emails/organization-invitation";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { VerifyEmail } from "@/emails/verify-email";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/get-base-url";
import { OrganizationRole } from "@/lib/organization-role";
import {
  archiveStudentMembership,
  mirrorStudentMembership,
} from "@/lib/student-sync";
import { db } from "@/prisma/db";

const baseUrl = getBaseUrl();

/** 7 days. The 48h default is tight for students who check email weekly. */
const INVITATION_EXPIRES_IN = 60 * 60 * 24 * 7;

export const auth = betterAuth({
  // Reuse the app's Prisma singleton — a second client would double the Neon
  // connection footprint on every serverless invocation.
  database: prismaAdapter(db, { provider: "postgresql" }),

  baseURL: baseUrl,
  secret: env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    baseUrl,
    ...(env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // Preview deployments get a fresh hostname per deploy. Only trust the
    // wildcard outside production — in production it would trust every app on
    // vercel.app as a request origin.
    ...(env.VERCEL_ENV !== "production" ? ["https://*.vercel.app"] : []),
  ],

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    // Not required on purpose: an invited student's link already proves they
    // control that mailbox, and gating sign-up would put a second email hop
    // between the invitation and joining a batch. `sendOnSignUp` below still
    // gets addresses verified passively. To enforce it later, flip this and
    // `requireEmailVerificationOnInvitation` together.
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your TutorOS password",
        react: ResetPasswordEmail({ userName: user.name, resetLink: url }),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Confirm your email address",
        react: VerifyEmail({ userName: user.name, verifyLink: url }),
      });
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Land returning users straight in their workspace instead of bouncing
        // them through /select-organization on every sign-in.
        before: async (session) => {
          const membership = await db.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId,
            },
          };
        },
      },
    },
  },

  plugins: [
    organization({
      creatorRole: OrganizationRole.OWNER,
      allowUserToCreateOrganization: true,
      // Re-inviting the same address replaces the pending row instead of
      // stacking a second one behind it.
      cancelPendingInvitationsOnReInvite: true,
      invitationExpiresIn: INVITATION_EXPIRES_IN,

      async sendInvitationEmail(data) {
        await sendEmail({
          to: data.email,
          subject: `You're invited to join ${data.organization.name} on TutorOS`,
          react: OrganizationInvitationEmail({
            organizationName: data.organization.name,
            invitedByName: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            inviteLink: `${baseUrl}/accept-invitation/${data.id}`,
          }),
        });
      },

      // Replaces app/api/webhooks/clerk/route.ts. Owners are deliberately not
      // mirrored — only `member` role memberships become Student rows, so the
      // remove/demote paths must tolerate there being no row to archive.
      organizationHooks: {
        afterAcceptInvitation: async ({ member, user, organization: org }) => {
          if (member.role !== OrganizationRole.STUDENT) return;
          await mirrorStudentMembership({
            organizationId: org.id,
            userId: user.id,
            name: user.name,
            email: user.email,
          });
        },

        afterAddMember: async ({ member, user, organization: org }) => {
          if (member.role !== OrganizationRole.STUDENT) return;
          await mirrorStudentMembership({
            organizationId: org.id,
            userId: user.id,
            name: user.name,
            email: user.email,
          });
        },

        afterRemoveMember: async ({ member, organization: org }) => {
          await archiveStudentMembership({
            organizationId: org.id,
            userId: member.userId,
          });
        },

        // A role change goes either direction: promoted to owner (they stop
        // being a student — archive) or demoted to member (mirror them in,
        // restoring an archived row if one exists).
        afterUpdateMemberRole: async ({ member, user, organization: org }) => {
          if (member.role === OrganizationRole.STUDENT) {
            await mirrorStudentMembership({
              organizationId: org.id,
              userId: user.id,
              name: user.name,
              email: user.email,
            });
            return;
          }

          await archiveStudentMembership({
            organizationId: org.id,
            userId: user.id,
          });
        },
      },
    }),

    // Must stay last: it wraps the handlers so Server Actions can set cookies.
    nextCookies(),
  ],
});
