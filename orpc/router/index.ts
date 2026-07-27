import { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { ownerBatchRouter } from "./owner/batch";
import { ownerStudentRouter } from "./owner/student";
import { ownerClassRouter } from "./owner/class";
import { batchStudentRouter } from "./owner/batchStudent";
import { ownerBatchSessionRouter } from "./owner/batchSession";
import { ownerExamRouter } from "./owner/exam";
import { ownerAttendanceRouter } from "./owner/attendance";
import { ownerDashboardRouter } from "./owner/dashboard";
import { studentMeRouter } from "./student/me";
import { studentBatchRouter } from "./student/batch";
import { studentDashboardRouter } from "./student/dashboard";
import { studentAttendanceRouter } from "./student/attendance";
import { studentExamRouter } from "./student/exam";
import { studentCalendarRouter } from "./student/calendar";

export const router = {
  owner: {
    batch: ownerBatchRouter,
    student: ownerStudentRouter,
    class: ownerClassRouter,
    batchStudent: batchStudentRouter,
    batchSession: ownerBatchSessionRouter,
    exam: ownerExamRouter,
    attendance: ownerAttendanceRouter,
    dashboard: ownerDashboardRouter,
  },
  student: {
    me: studentMeRouter,
    batch: studentBatchRouter,
    dashboard: studentDashboardRouter,
    attendance: studentAttendanceRouter,
    exam: studentExamRouter,
    calendar: studentCalendarRouter,
  },
};

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
