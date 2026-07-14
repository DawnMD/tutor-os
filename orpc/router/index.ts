import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";

export const router = {};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
