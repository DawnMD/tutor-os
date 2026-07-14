import { protectedProcedure } from "@/orpc/orpc";
import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { orgRouter } from "./org";

export const router = {
  ping: protectedProcedure.handler(() => "Ping"),
  org: orgRouter,
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
