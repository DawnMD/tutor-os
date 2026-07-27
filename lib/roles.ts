import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationRole } from "@/orpc/orpc";

/**
 * Read the active organization role for the current request. Returns the raw
 * Clerk role string (`org:admin` for owners, `org:member` for students) or
 * `null` when there is no active organization. Compare against
 * {@link OrganizationRole} — never a literal — so the owner role stays a single
 * server-safe const shared with the RPC layer.
 */
export async function getOrgRole() {
  const { orgRole } = await auth();
  return orgRole ?? null;
}

/** True when the current request's active-org role is the owner (`org:admin`). */
export async function isOwner() {
  return (await getOrgRole()) === OrganizationRole.OWNER;
}

/**
 * Page-level guard for owner-only server pages. Redirects non-owners (students
 * and no-org sessions) to `/dashboard`, which itself branches by role. This is
 * UX only — the RPC role middleware is the real security boundary.
 */
export async function requireOwnerPage() {
  if (!(await isOwner())) {
    redirect("/dashboard");
  }
}
