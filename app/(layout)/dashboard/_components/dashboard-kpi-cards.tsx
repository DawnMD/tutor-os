"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboard-stats";
import Link from "next/link";
import {
  CalendarCheck,
  Layers,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";

interface DashboardKpiCardsProps {
  kpis: DashboardKpis;
  pendingInvites: number | null;
}

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

export function DashboardKpiCards({
  kpis,
  pendingInvites,
}: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiTile
        title="Active students"
        value={String(kpis.activeStudents)}
        subtext={`${kpis.classCount} ${kpis.classCount === 1 ? "class" : "classes"}`}
        icon={<Users className="h-4 w-4" />}
      />
      <KpiTile
        title="Active batches"
        value={String(kpis.activeBatches)}
        subtext="Across all classes"
        icon={<Layers className="h-4 w-4" />}
      />
      <KpiTile
        title="Sessions this week"
        value={String(kpis.sessionsCompletedThisWeek)}
        subtext="Completed"
        icon={<CalendarCheck className="h-4 w-4" />}
      />
      <KpiTile
        title="Attendance"
        value={kpis.attendanceRate30d == null ? "—" : `${kpis.attendanceRate30d}%`}
        subtext="Last 30 days"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <Link
        href="/students/pending"
        className="rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <KpiTile
          title="Pending invites"
          value={pendingInvites == null ? "—" : String(pendingInvites)}
          subtext="Awaiting sign-up"
          icon={<Mail className="h-4 w-4" />}
        />
      </Link>
    </div>
  );
}
