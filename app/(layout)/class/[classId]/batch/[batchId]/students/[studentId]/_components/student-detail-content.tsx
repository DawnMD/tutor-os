"use client";

import { getArchivedScope } from "@/lib/archived-error";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { UserX } from "lucide-react";
import { BatchArchivedState } from "../../../_components/batch-archived-state";
import { EmptyState } from "./empty-state";
import { QuickActionsCard } from "./quick-actions-card";
import { StudentActionsProvider } from "./student-actions";
import { StudentDetailSkeleton } from "./student-detail-skeleton";
import { StudentHeader } from "./student-header";
import { StudentKpiCards } from "./student-kpi-cards";
import { StudentTabs } from "./student-tabs";

interface StudentDetailContentProps {
  classId: string;
  batchId: string;
  studentId: string;
}

export function StudentDetailContent({
  classId,
  batchId,
  studentId,
}: StudentDetailContentProps) {
  const { data: student, isLoading, error } = useQuery(
    orpc.owner.batchStudent.getStudentDashboard.queryOptions({
      input: { batchId, studentId },
    }),
  );

  if (isLoading) {
    return <StudentDetailSkeleton />;
  }

  const archivedScope = getArchivedScope(error);
  if (archivedScope === "batch" || archivedScope === "class") {
    return <BatchArchivedState scope={archivedScope} />;
  }

  if (!student) {
    return (
      <EmptyState
        icon={UserX}
        title="Student not found"
        description="This student isn't part of this batch, or may have been removed."
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <StudentActionsProvider
      student={student}
      classId={classId}
      batchId={batchId}
      studentId={studentId}
    >
      <div className="space-y-6">
        <StudentHeader student={student} />
        <StudentKpiCards student={student} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="order-2 min-w-0 lg:order-1 lg:col-span-2">
            <StudentTabs student={student} />
          </div>

          {/* Sidebar — sticky on desktop, above tabs on mobile */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-4">
              <QuickActionsCard />
            </div>
          </div>
        </div>
      </div>
    </StudentActionsProvider>
  );
}
