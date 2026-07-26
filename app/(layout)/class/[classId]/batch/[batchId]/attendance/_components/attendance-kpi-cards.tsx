"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  UserX,
  LucideIcon,
} from "lucide-react";
import {
  AttendanceOverview,
  AttendanceSession,
  attendedFromCounts,
  countStatuses,
  isConducted,
  percentage,
  sessionCounts,
} from "./utils";

interface AttendanceKpiCardsProps {
  overview: AttendanceOverview;
  activeSession: AttendanceSession | null;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "emerald" | "rose";
}

const TONES: Record<string, string> = {
  emerald:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  muted: "bg-muted text-muted-foreground",
};

export function AttendanceKpiCards({
  overview,
  activeSession,
}: AttendanceKpiCardsProps) {
  // Overall rate across every conducted session's records.
  const overall = countStatuses(
    overview.sessions
      .filter(isConducted)
      .flatMap((s) => s.attendance.map((r) => r.status)),
  );
  const overallRate = percentage(attendedFromCounts(overall), overall.marked);

  const todayCounts = activeSession
    ? sessionCounts(activeSession)
    : null;
  const total = overview.students.length;

  const kpis: Kpi[] = [
    {
      label: "Attendance Rate",
      value: overall.marked ? `${overallRate}%` : "—",
      hint: overall.marked
        ? "present + late, all sessions"
        : "No attendance yet",
      icon: TrendingUp,
    },
    {
      label: "Today's Status",
      value: todayCounts ? `${todayCounts.marked} / ${total}` : "—",
      hint: todayCounts ? "students marked" : "No active session",
      icon: ClipboardList,
    },
    {
      label: "Present Today",
      value: todayCounts ? String(todayCounts.present + todayCounts.late) : "—",
      hint: todayCounts?.late
        ? `${todayCounts.late} arrived late`
        : "present or late",
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      label: "Absent Today",
      value: todayCounts ? String(todayCounts.absent) : "—",
      hint: todayCounts?.excused
        ? `${todayCounts.excused} excused`
        : "not present",
      icon: UserX,
      tone: "rose",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} size="sm">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </p>
              <p className="truncate text-2xl font-bold tracking-tight tabular-nums">
                {kpi.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {kpi.hint}
              </p>
            </div>
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                TONES[kpi.tone ?? "muted"],
              )}
            >
              <kpi.icon className="size-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
