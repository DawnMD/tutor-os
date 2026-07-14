import { env } from "@/env";
import type { Context } from "@/orpc/context";
import { ORPCError, os } from "@orpc/server";

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
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

export const publicProcedure = base.use(timingMiddleware);

export const protectedProcedure = base
  .use(timingMiddleware)
  .use(async ({ context, next }) => {
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
  });
