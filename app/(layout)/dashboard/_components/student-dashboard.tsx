"use client";

import { StudentGate } from "@/components/student/student-gate";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  getKpis,
  getNextClass,
  getRecentResults,
  getRecentSessions,
  getTodayClasses,
  getUpcomingExams,
} from "@/lib/student-dashboard-stats";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { addDays, startOfWeek, subDays, subWeeks } from "date-fns";
import { GraduationCap } from "lucide-react";
import { useMemo } from "react";
import { StudentDashboardKpiCards } from "./student-dashboard-kpi-cards";
import { StudentDashboardSkeleton } from "./student-dashboard-skeleton";
import { StudentNextClassCard } from "./student-next-class-card";
import { StudentRecentResultsCard } from "./student-recent-results-card";
import { StudentRecentSessionsCard } from "./student-recent-sessions-card";
import { StudentUpcomingExamsCard } from "./student-upcoming-exams-card";

export function StudentDashboard() {
  return (
    <StudentGate>
      <StudentDashboardBody />
    </StudentGate>
  );
}

function StudentDashboardBody() {
  // Stable "now"; the window pads a day at each edge so any timezone skew never
  // drops boundary rows (all real bucketing happens client-side).
  const now = useMemo(() => new Date(), []);
  const { rangeStart, rangeEnd } = useMemo(
    () => ({
      rangeStart: subDays(startOfWeek(subWeeks(now, 7), { weekStartsOn: 0 }), 1),
      rangeEnd: addDays(now, 31),
    }),
    [now],
  );

  const { data, isLoading } = useQuery(
    orpc.student.dashboard.getDashboardData.queryOptions({
      input: { rangeStart, rangeEnd },
    }),
  );

  const derived = useMemo(() => {
    if (!data) return null;
    return {
      kpis: getKpis(data, now),
      today: getTodayClasses(data, now),
      nextClass: getNextClass(data, now),
      recentSessions: getRecentSessions(data, now),
      upcomingExams: getUpcomingExams(data, now),
      recentResults: getRecentResults(data),
    };
  }, [data, now]);

  if (isLoading || !derived) {
    return <StudentDashboardSkeleton />;
  }

  if (data && data.batches.length === 0) {
    return (
      <div className="space-y-6">
        <StudentDashboardKpiCards kpis={derived.kpis} />
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCap />
            </EmptyMedia>
            <EmptyTitle>No batches yet</EmptyTitle>
            <EmptyDescription>
              You&apos;re not enrolled in any batches yet. Once your tutor adds
              you to a batch, your schedule, attendance and exam results will
              appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentDashboardKpiCards kpis={derived.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <StudentNextClassCard
            nextClass={derived.nextClass}
            today={derived.today}
          />
          <StudentRecentSessionsCard sessions={derived.recentSessions} />
        </div>
        <div className="space-y-6">
          <StudentUpcomingExamsCard exams={derived.upcomingExams} />
          <StudentRecentResultsCard results={derived.recentResults} />
        </div>
      </div>
    </div>
  );
}
