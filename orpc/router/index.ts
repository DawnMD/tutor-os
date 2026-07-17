import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { ownerBatchRouter } from "./owner/batch";
import { ownerStudentRouter } from "./owner/student";

export const router = {
  owner: {
    batch: ownerBatchRouter,
    student: ownerStudentRouter,
  },
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
