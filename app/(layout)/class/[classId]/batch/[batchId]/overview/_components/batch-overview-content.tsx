"use client";

import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import AttendanceChartCard from "./attendance-chart-card";
import BatchHeader from "./batch-header";
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
  const { data: batch, isLoading } = useQuery(
    orpc.owner.batch.getBatchDataById.queryOptions({
      input: {
        batchId,
      },
    }),
  );

  if (!batch || isLoading) {
    return <div>Loading...</div>;
  }

  const totalStudents = batch.students.length;
  const activeStudents = batch.students.filter(
    (bs) => !bs.student.archivedAt,
  ).length;

  return (
    <div className="space-y-6">
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
