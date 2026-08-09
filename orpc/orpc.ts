import { env } from "@/env";
import type { Context } from "@/orpc/context";
import { ORPCError, os } from "@orpc/server";

// Re-exported so the existing import sites (client components included) keep
// working. The const itself lives in a zero-import module because `lib/auth.ts`
// needs it too, and importing it from here would cycle back through
// `orpc/context.ts` into `lib/auth.ts`.
import { OrganizationRole } from "@/lib/organization-role";
export { OrganizationRole };

const base = os.$context<Context>();

const timingMiddleware = os.middleware(async ({ path, next }) => {
  const start = Date.now();

  if (env.NODE_ENV === "development") {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[ORPC] ${path} took ${end - start}ms to execute`);

  return result;
});

export const publicProcedure = base.use(timingMiddleware);

export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    const user = context.userId;

    if (!user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({
      context: {
        ...context,
        userId: user,
      },
    });
  },
);

const organizationProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    if (!context.organizationId) {
      throw new ORPCError("FORBIDDEN", {
        message: "No active organization selected.",
      });
    }

    return next({
      context: {
        ...context,
        organizationId: context.organizationId,
        organizationRole: context.organizationRole,
      },
    });
  },
);

const roleProcedure = (role: OrganizationRole) =>
  organizationProcedure.use(async ({ context, next }) => {
    if (context.organizationRole !== role) {
      throw new ORPCError("FORBIDDEN");
    }

    return next();
  });

export const ownerProcedure = roleProcedure(OrganizationRole.OWNER);
export const studentProcedure = roleProcedure(OrganizationRole.STUDENT);
