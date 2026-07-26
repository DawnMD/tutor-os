"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarClock,
  GraduationCap,
  LucideIcon,
  Percent,
  SquarePen,
} from "lucide-react";
import { examAverage, gradedCount, isUpcoming, ExamsPage } from "./utils";

interface ExamsKpiCardsProps {
  batch: ExamsPage;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function ExamsKpiCards({ batch }: ExamsKpiCardsProps) {
  const exams = batch.exams;
  const totalStudents = batch._count.students;

  const upcomingCount = exams.filter(isUpcoming).length;

  // Grading coverage: results recorded vs. the graded slots that could exist
  // for past exams (upcoming exams don't count against coverage).
  const pastExams = exams.filter((e) => !isUpcoming(e));
  const gradedSlots = pastExams.reduce((sum, e) => sum + gradedCount(e), 0);
  const possibleSlots = pastExams.length * totalStudents;
  const coverage =
    possibleSlots > 0 ? Math.round((gradedSlots / possibleSlots) * 100) : 0;

  // Batch average across every exam that has at least one recorded result.
  const examAverages = exams
    .map(examAverage)
    .filter((a): a is number => a !== null);
  const batchAverage =
    examAverages.length > 0
      ? Math.round(examAverages.reduce((s, a) => s + a, 0) / examAverages.length)
      : null;

  const kpis: Kpi[] = [
    {
      label: "Total Exams",
      value: String(exams.length),
      hint: exams.length === 1 ? "exam created" : "exams created",
      icon: SquarePen,
    },
    {
      label: "Upcoming",
      value: String(upcomingCount),
      hint: upcomingCount === 1 ? "exam scheduled" : "exams scheduled",
      icon: CalendarClock,
      accent: upcomingCount > 0,
    },
    {
      label: "Grading Coverage",
      value: pastExams.length > 0 ? `${coverage}%` : "—",
      hint:
        pastExams.length > 0
          ? `${gradedSlots} of ${possibleSlots} marked`
          : "No past exams",
      icon: GraduationCap,
    },
    {
      label: "Batch Average",
      value: batchAverage !== null ? `${batchAverage}%` : "—",
      hint:
        batchAverage !== null
          ? `across ${examAverages.length} ${examAverages.length === 1 ? "exam" : "exams"}`
          : "No results yet",
      icon: Percent,
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
