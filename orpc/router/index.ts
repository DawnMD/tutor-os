import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { ownerBatchRouter } from "./owner/batch";
import { ownerStudentRouter } from "./owner/student";
import { ownerClassRouter } from "./owner/class";
import { batchStudentRouter } from "./owner/batchStudent";

export const router = {
  owner: {
    batch: ownerBatchRouter,
    student: ownerStudentRouter,
    class: ownerClassRouter,
    batchStudent: batchStudentRouter,
  },
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
