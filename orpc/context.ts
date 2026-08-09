import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function createContext(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  const userId = session?.user.id ?? null;
  const organizationId = session?.session.activeOrganizationId ?? null;

  // Read the role straight from `member` rather than going back through
  // `auth.api.getActiveMemberRole`, which would re-resolve the session we just
  // read. The lookup is covered by member(organizationId) / member(userId).
  const membership =
    userId && organizationId
      ? await db.member.findFirst({
          where: { organizationId, userId },
          select: { role: true },
        })
      : null;

  return {
    db,
    // Better Auth's server API is header-driven, so procedures that call
    // `auth.api.*` (invitations, organizations) need the request's headers.
    headers,
    userId,
    organizationId,
    organizationRole: membership?.role ?? null,
    sessionId: session?.session.id ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
