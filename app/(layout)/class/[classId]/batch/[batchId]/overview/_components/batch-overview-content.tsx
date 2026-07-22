"use client";

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
import { orpc } from "@/orpc/client";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48 " />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 " />
              <Skeleton className="h-10 w-32 " />
              <Skeleton className="h-10 w-32 " />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card  border border-border p-4 space-y-3"
            >
              <Skeleton className="h-4 w-20 " />
              <Skeleton className="h-8 w-16 " />
              <Skeleton className="h-3 w-24 " />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Session */}
            <div className="bg-card  border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-32 " />
              <Skeleton className="h-32 w-full " />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32 " />
                <Skeleton className="h-10 w-32 " />
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-card  border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-40 " />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full " />
                ))}
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="bg-card  border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-40 " />
              <Skeleton className="h-48 w-full " />
            </div>

            {/* Recent Sessions */}
            <div className="bg-card  border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-40 " />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border border-border  space-y-2">
                    <Skeleton className="h-4 w-32 " />
                    <Skeleton className="h-3 w-48 " />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Student Summary */}
            <div className="bg-card  border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-32 " />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full " />
                <Skeleton className="h-4 w-full " />
              </div>
              <div className="space-y-2 pt-2 border-t border-border">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full " />
                ))}
              </div>
            </div>

            {/* Upcoming Exams */}
            <div className="bg-card  border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-40 " />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 border border-border  space-y-2">
                    <Skeleton className="h-4 w-24 " />
                    <Skeleton className="h-3 w-32 " />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full " />
            </div>

            {/* Quick Actions */}
            <div className="bg-card  border border-border p-6 space-y-3">
              <Skeleton className="h-6 w-32 " />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full " />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
          <RecentSessionsCard sessions={batch.sessions} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Student Summary */}
          <StudentSummaryCard
            students={batch.students}
            totalStudents={totalStudents}
          />

          {/* Upcoming Exams */}
          <UpcomingExamsCard exams={batch.exams} />

          {/* Quick Actions */}
          <QuickActionsPanel batchId={batch.id} classId={batch.classId} />
        </div>
      </div>

      {/* Attendance Chart */}
      <AttendanceChartCard sessions={batch.sessions} />
    </div>
  );
}
