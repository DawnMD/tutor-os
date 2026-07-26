"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  CalendarDays,
  History,
  Layers,
  LucideIcon,
} from "lucide-react";
import {
  DAY_LABELS,
  formatMinutes,
  getNextScheduled,
  isAttendancePending,
  relativeDayLabel,
  SessionsPage,
} from "./utils";

interface SessionsKpiCardsProps {
  batch: SessionsPage;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function SessionsKpiCards({ batch }: SessionsKpiCardsProps) {
  const sessions = batch.sessions;

  const pendingCount = sessions.filter(isAttendancePending).length;

  const nowMs = new Date().getTime();
  const lastConducted = sessions.find(
    (s) => new Date(s.classDate).getTime() <= nowMs,
  );

  const next = getNextScheduled(batch.schedules);

  const kpis: Kpi[] = [
    {
      label: "Total Sessions",
      value: String(sessions.length),
      hint: sessions.length === 1 ? "class logged" : "classes logged",
      icon: Layers,
    },
    {
      label: "Attendance Pending",
      value: String(pendingCount),
      hint: pendingCount === 1 ? "session to mark" : "sessions to mark",
      icon: AlertCircle,
      accent: pendingCount > 0,
    },
    {
      label: "Last Session",
      value: lastConducted
        ? relativeDayLabel(new Date(lastConducted.classDate))
        : "—",
      hint: lastConducted?.topic || "No sessions yet",
      icon: History,
    },
    {
      label: "Next Scheduled Class",
      value: next ? DAY_LABELS[next.day] : "—",
      hint: next ? formatMinutes(next.startMinutes) : "No schedule set",
      icon: CalendarDays,
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
              <p className="truncate text-2xl font-bold tracking-tight">
                {kpi.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {kpi.hint}
              </p>
            </div>
            <div
              className={
                kpi.accent
                  ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              }
            >
              <kpi.icon className="size-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
