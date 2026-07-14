import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/prisma/db";

export async function createContext() {
  const { userId, orgId, orgRole, sessionId } = await auth();
  const clerk = await clerkClient();

  return {
    db,
    clerk,
    userId,
    organizationId: orgId,
    organizationRole: orgRole,
    sessionId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
