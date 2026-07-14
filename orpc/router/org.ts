import { ownerProcedure } from "../orpc";
import * as z from "zod";

export const orgRouter = {
  getOrgsList: ownerProcedure.handler(async ({ context }) => {
    const { data } = await context.clerk.organizations.getOrganizationList();

    return data;
  }),
  getCurrentOrg: ownerProcedure.handler(async ({ context }) => {
    return await context.clerk.organizations.getOrganization({
      organizationId: context.organizationId,
    });
  }),
  createOrg: ownerProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.clerk.organizations.createOrganization({
        name: input.name,
        createdBy: context.userId,
      });
    }),
};
