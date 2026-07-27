"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { orpc } from "@/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import AttendanceChartCard from "./attendance-chart-card";
import BatchHeader from "./batch-header";
import BatchOverviewSkeleton from "./batch-overview-skeleton";
import KPICards from "./kpi-cards";
import QuickActionsPanel from "./quick-actions-panel";
import RecentSessionsCard from "./recent-sessions-card";
import StudentSummaryCard from "./student-summary-card";
import TodaySessionCard from "./today-session-card";
import UpcomingExamsCard from "./upcoming-exams-card";
import WeeklyScheduleCard from "./weekly-schedule-card";

interface BatchOverviewContentProps {
  batchId: string;
}

export default function BatchOverviewContent({
  batchId,
}: BatchOverviewContentProps) {
  const queryClient = useQueryClient();
  const { data: batch, isLoading, isError } = useQuery(
    orpc.owner.batch.getBatchDataById.queryOptions({
      input: {
        batchId,
      },
    }),
  );

  const { mutateAsync: unArchieveClass, isPending: isRestoringClass } =
    useMutation(
      orpc.owner.class.unArchieveClass.mutationOptions({
        onSuccess: () => {
          // Restoring the class re-enables this batch everywhere.
          queryClient.invalidateQueries();
        },
      }),
    );

  if (isLoading) {
    return <BatchOverviewSkeleton />;
  }

  if (isError || !batch) {
    return (
      <Card className="border-dashed py-0">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>Batch not found</EmptyTitle>
            <EmptyDescription>
              This batch may have been deleted or you don&apos;t have access to
              it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  // Roster is pre-filtered to active students server-side.
  const activeStudents = batch.students.length;
  const totalStudents = batch._count.students;
  const classArchived = Boolean(batch.class.archivedAt);

  const onRestoreClass = () => {
    toast.promise(unArchieveClass({ id: batch.classId }), {
      loading: "Restoring class...",
      success: "Class restored",
      error: (err) =>
        err instanceof Error ? err.message : "Failed to restore class",
    });
  };

  return (
    <div className="space-y-6">
      {classArchived && (
        <Card className="border-dashed border-destructive/50 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Class archived</p>
                <p className="text-sm text-muted-foreground">
                  The class &ldquo;{batch.class.name}&rdquo; is archived. Restore
                  the class to make changes to this batch.
                </p>
              </div>
            </div>
            <Button
              onClick={onRestoreClass}
              disabled={isRestoringClass}
              className="shrink-0"
            >
              Restore Class
            </Button>
          </div>
        </Card>
      )}

      {/* Batch Header */}
      <BatchHeader batch={batch} />

      {/* KPI Cards Grid */}
      <KPICards
        batch={batch}
        totalStudents={totalStudents}
        activeStudents={activeStudents}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Session Card */}
          <TodaySessionCard batch={batch} />

          {/* Weekly Schedule Card */}
          <WeeklyScheduleCard schedules={batch.schedules} />

          {/* Recent Sessions Card */}
          <RecentSessionsCard
            sessions={batch.sessions}
            classId={batch.classId}
            batchId={batch.id}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Student Summary */}
          <StudentSummaryCard totalStudents={totalStudents} batch={batch} />

          {/* Upcoming Exams */}
          <UpcomingExamsCard
            exams={batch.exams}
            classId={batch.classId}
            batchId={batch.id}
          />

          {/* Quick Actions */}
          <QuickActionsPanel batchId={batch.id} classId={batch.classId} />
        </div>
      </div>

      {/* Attendance Chart */}
      <AttendanceChartCard sessions={batch.sessions} />
    </div>
  );
}
