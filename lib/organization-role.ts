/**
 * The two Better Auth organization roles this app uses, as a single const.
 *
 * `owner` is the tutor who created the workspace; `member` is a student invited
 * into it. These are Better Auth's built-in role names, so no custom access
 * control statement is needed — the organization plugin already understands
 * them and assigns `owner` to whoever creates an organization.
 *
 * This module deliberately imports nothing. Both `lib/auth.ts` (server) and
 * `orpc/orpc.ts` (re-exported to client components) need it, and putting it in
 * either of those would create an import cycle.
 */
export const OrganizationRole = {
  OWNER: "owner",
  STUDENT: "member",
} as const;

export type OrganizationRole =
  (typeof OrganizationRole)[keyof typeof OrganizationRole];
