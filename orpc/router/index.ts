import { protectedProcedure } from "@/orpc/orpc";
import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";

export const router = {
  ping: protectedProcedure.handler(() => "Ping"),
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
