import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AcceptInvitationActions } from "@/components/auth/accept-invitation-actions";
import { AuthCard, AuthShell } from "@/components/auth/auth-card";
import { SignOutLink } from "@/components/auth/sign-out-link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthSession } from "@/lib/roles";
import { db } from "@/prisma/db";

export const metadata: Metadata = {
  title: "Accept invitation",
};

function InvitationProblem({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell>
      <AuthCard
        title="This invitation isn't usable"
        footer={
          <Link href="/sign-in" className="underline underline-offset-4">
            Go to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">{children}</p>
      </AuthCard>
    </AuthShell>
  );
}

export default async function AcceptInvitationPage({
  params,
}: PageProps<"/accept-invitation/[invitationId]">) {
  const { invitationId } = await params;

  // Read the row directly: `auth.api.getInvitation` requires a session, and we
  // need the organization's name to render the signed-out branch too.
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
      organizationId: true,
      organization: { select: { name: true } },
    },
  });

  if (!invitation) {
    return (
      <InvitationProblem>
        We couldn&apos;t find this invitation. Ask your tutor to send a new one.
      </InvitationProblem>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <InvitationProblem>
        This invitation has already been {invitation.status}. If you think
        that&apos;s a mistake, ask your tutor to invite you again.
      </InvitationProblem>
    );
  }

  if (invitation.expiresAt <= new Date()) {
    return (
      <InvitationProblem>
        This invitation has expired. Ask your tutor to resend it — the new link
        will be valid for another week.
      </InvitationProblem>
    );
  }

  const organizationName = invitation.organization.name;
  const session = await getAuthSession();

  // Signed out: create the account first, with the invited address locked in so
  // the accept step below can't fail on a mismatch.
  if (!session) {
    return (
      <AuthShell>
        <AuthCard
          title={`Join ${organizationName}`}
          description={`Create your account for ${invitation.email} to accept this invitation.`}
          footer={
            <>
              Already have an account?{" "}
              <Link
                href={`/sign-in?redirect=/accept-invitation/${invitation.id}`}
                className="underline underline-offset-4"
              >
                Sign in
              </Link>
            </>
          }
        >
          <Suspense fallback={<Skeleton className="h-72" />}>
            <SignUpForm
              defaultEmail={invitation.email}
              lockEmail
              redirectTo={`/accept-invitation/${invitation.id}`}
            />
          </Suspense>
        </AuthCard>
      </AuthShell>
    );
  }

  // Signed in as somebody else: accepting would silently attach the batch to
  // the wrong account, so make them switch.
  if (session.user.email !== invitation.email) {
    return (
      <AuthShell>
        <AuthCard
          title="Wrong account"
          description={`This invitation was sent to ${invitation.email}, but you're signed in as ${session.user.email}.`}
        >
          <SignOutLink label="Sign out and switch account" />
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        title={`Join ${organizationName}`}
        description={`You've been invited to ${organizationName} on TutorOS.`}
      >
        <AcceptInvitationActions
          invitationId={invitation.id}
          organizationId={invitation.organizationId}
        />
      </AuthCard>
    </AuthShell>
  );
}
