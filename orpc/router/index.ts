import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { ownerBatchRouter } from "./owner/batch";
import { ownerStudentRouter } from "./owner/student";
import { ownerClassRouter } from "./owner/class";
import { batchStudentRouter } from "./owner/batchStudent";
import { ownerBatchSessionRouter } from "./owner/batchSession";
import { ownerExamRouter } from "./owner/exam";
import { ownerAttendanceRouter } from "./owner/attendance";

export const router = {
  owner: {
    batch: ownerBatchRouter,
    student: ownerStudentRouter,
    class: ownerClassRouter,
    batchStudent: batchStudentRouter,
    batchSession: ownerBatchSessionRouter,
    exam: ownerExamRouter,
    attendance: ownerAttendanceRouter,
  },
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
