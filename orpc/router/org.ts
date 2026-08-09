import { auth } from "@/lib/auth";
import { protectedProcedure } from "@/orpc/orpc";
import { ORPCError } from "@orpc/client";
import * as z from "zod";

/** "Salt Lake Batch" -> "salt-lake-batch" */
function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace"
  );
}

export const orgRouter = {
  /**
   * Create a workspace for the signed-in user, who becomes its owner.
   *
   * This lives on the server because Better Auth organizations need a globally
   * unique `slug` that Clerk's `createOrganization()` used to invent silently.
   * Activating the new workspace stays on the client (`organization.setActive`)
   * — the session cookie it rewrites doesn't propagate out of an oRPC handler.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(80) }))
    .handler(async ({ context, input }) => {
      const base = slugify(input.name);

      // Check-then-create races, so retry on collision rather than trusting a
      // single lookup.
      for (let attempt = 0; attempt < 5; attempt++) {
        const slug =
          attempt === 0
            ? base
            : `${base}-${Math.random().toString(36).slice(2, 7)}`;

        const taken = await context.db.organization.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (taken) continue;

        const organization = await auth.api.createOrganization({
          body: { name: input.name, slug },
          headers: context.headers,
        });

        if (!organization) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Could not create the workspace.",
          });
        }

        return { id: organization.id, name: organization.name };
      }

      throw new ORPCError("CONFLICT", {
        message: "Could not generate a unique workspace address. Try another name.",
      });
    }),
};
