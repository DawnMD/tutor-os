"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentKpis } from "@/lib/student-dashboard-stats";
import { CalendarClock, GraduationCap, Layers, TrendingUp } from "lucide-react";

function KpiTile({
  title,
  value,
  subtext,
  icon,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

export function StudentDashboardKpiCards({ kpis }: { kpis: StudentKpis }) {
  const latest = kpis.latestResult;

  return (
    <div
      data-tour="student-kpis"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <KpiTile
        title="Attendance"
        value={kpis.attendanceRate == null ? "—" : `${kpis.attendanceRate}%`}
        subtext="All-time across your batches"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KpiTile
        title="My batches"
        value={String(kpis.batchesEnrolled)}
        subtext="Currently enrolled"
        icon={<Layers className="h-4 w-4" />}
      />
      <KpiTile
        title="Upcoming exams"
        value={String(kpis.upcomingExams)}
        subtext="Scheduled ahead"
        icon={<CalendarClock className="h-4 w-4" />}
      />
      <KpiTile
        title="Latest result"
        value={latest ? `${latest.percentage}%` : "—"}
        subtext={
          latest
            ? `${latest.title} · ${latest.marks}/${latest.totalMarks}`
            : "No results yet"
        }
        icon={<GraduationCap className="h-4 w-4" />}
      />
    </div>
  );
}
