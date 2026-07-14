import { publicProcedure } from "@/orpc/orpc";
import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";

export const router = {
  ping: publicProcedure.handler(() => "Ping"),
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
