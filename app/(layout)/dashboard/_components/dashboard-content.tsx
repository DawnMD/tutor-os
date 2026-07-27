"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildAttendanceTrend,
  buildKpis,
  buildRecentActivity,
  buildStudentsNeedingAttention,
  buildTodaySchedule,
  buildUpcomingExams,
} from "@/lib/dashboard-stats";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { addDays, startOfWeek, subDays, subWeeks } from "date-fns";
import { LayoutDashboard } from "lucide-react";
import { useMemo } from "react";
import { AttendanceTrendCard } from "./attendance-trend-card";
import { AttentionStudentsCard } from "./attention-students-card";
import { DashboardKpiCards } from "./dashboard-kpi-cards";
import { PendingInvitationsCard } from "./pending-invitations-card";
import { RecentActivityCard } from "./recent-activity-card";
import { TodayScheduleCard } from "./today-schedule-card";
import { UpcomingExamsCard } from "./upcoming-exams-card";

export function DashboardContent() {
  // Stable "now" for the render pass; the window pads a day at each edge so
  // any server/client timezone skew never drops boundary rows (all real
  // bucketing happens client-side in lib/dashboard-stats).
  const now = useMemo(() => new Date(), []);
  const { rangeStart, rangeEnd } = useMemo(
    () => ({
      rangeStart: subDays(
        startOfWeek(subWeeks(now, 7), { weekStartsOn: 0 }),
        1,
      ),
      rangeEnd: addDays(now, 31),
    }),
    [now],
  );

  const { data, isLoading } = useQuery(
    orpc.owner.dashboard.getDashboardData.queryOptions({
      input: { rangeStart, rangeEnd },
    }),
  );

  const { data: invitations, isLoading: invitesLoading } = useQuery(
    orpc.owner.student.getPendingInvitations.queryOptions(),
  );

  const derived = useMemo(() => {
    if (!data) return null;
    return {
      kpis: buildKpis(data, now),
      today: buildTodaySchedule(data, now),
      trend: buildAttendanceTrend(data, now),
      attention: buildStudentsNeedingAttention(data, now),
      exams: buildUpcomingExams(data, now),
      activity: buildRecentActivity(data, now),
    };
  }, [data, now]);

  if (isLoading || !derived) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-80" />
            <Skeleton className="h-56" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-56" />
            <Skeleton className="h-44" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (data && data.batches.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardKpiCards
          kpis={derived.kpis}
          pendingInvites={invitations?.length ?? null}
        />
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutDashboard />
            </EmptyMedia>
            <EmptyTitle>Nothing to show yet</EmptyTitle>
            <EmptyDescription>
              Create a class and batch with a schedule to start seeing sessions,
              attendance and exams here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardKpiCards
        kpis={derived.kpis}
        pendingInvites={invitations?.length ?? null}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TodayScheduleCard schedule={derived.today} />
          <AttendanceTrendCard data={derived.trend} />
          <AttentionStudentsCard students={derived.attention} />
        </div>
        <div className="space-y-6">
          <UpcomingExamsCard exams={derived.exams} />
          <PendingInvitationsCard
            invitations={invitations}
            isLoading={invitesLoading}
          />
          <RecentActivityCard activity={derived.activity} />
        </div>
      </div>
    </div>
  );
}
