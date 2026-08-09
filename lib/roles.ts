import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { OrganizationRole } from "@/lib/organization-role";
import { db } from "@/prisma/db";

/**
 * Read the current session once per request.
 *
 * Unlike Clerk's `auth()`, which was a cookie read, this hits the database — and
 * a layout plus its page routinely ask for the session and the role several
 * times over. `cache()` collapses that back to a single query per request.
 */
export const getAuthSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** The viewer's membership in their active organization, or null. */
const getActiveMembership = cache(async () => {
  const session = await getAuthSession();
  const organizationId = session?.session.activeOrganizationId;

  if (!session || !organizationId) return null;

  return db.member.findFirst({
    where: { organizationId, userId: session.user.id },
    select: { role: true, organizationId: true },
  });
});

/** Page-level sign-in guard. Sends signed-out visitors to `/sign-in`. */
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) redirect("/sign-in");
  return session;
}

/**
 * `requireAuth` plus an active organization — every page under `(layout)`
 * assumes one. Returns everything those pages branch on, so the guard and the
 * role lookup are a single call.
 */
export async function requireOrganization() {
  const session = await requireAuth();
  const membership = await getActiveMembership();

  if (!membership) redirect("/select-organization");

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    isOwner: membership.role === OrganizationRole.OWNER,
  };
}

/**
 * Read the active organization role for the current request. Returns the raw
 * role string (`owner` for tutors, `member` for students) or `null` when there
 * is no active organization. Compare against {@link OrganizationRole} — never a
 * literal — so the owner role stays a single server-safe const shared with the
 * RPC layer.
 */
export async function getOrgRole() {
  return (await getActiveMembership())?.role ?? null;
}

/** True when the current request's active-org role is the owner (`owner`). */
export async function isOwner() {
  return (await getOrgRole()) === OrganizationRole.OWNER;
}

/**
 * Page-level guard for owner-only server pages. Signed-out visitors go to
 * `/sign-in`; signed-in non-owners (students and no-org sessions) go to
 * `/dashboard`, which itself branches by role. This is UX only — the RPC role
 * middleware is the real security boundary.
 */
export async function requireOwnerPage() {
  await requireAuth();

  if (!(await isOwner())) {
    redirect("/dashboard");
  }
}
