"use client";

import { Card } from "@/components/ui/card";
import { format, isToday, isYesterday } from "date-fns";
import {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { isAttended, percentage, StudentDashboard } from "./utils";

interface StudentKpiCardsProps {
  student: StudentDashboard;
}

function relativeDay(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
}

interface KpiProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  sub?: React.ReactNode;
}

function Kpi({ icon: Icon, label, value, hint, sub }: KpiProps) {
  return (
    <Card size="sm" className="gap-3">
      <div className="flex items-center justify-between px-(--card-spacing)">
        <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="px-(--card-spacing)">
        <div className="text-3xl font-bold leading-none tracking-tight">
          {value}
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="text-xs font-medium">{hint}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export function StudentKpiCards({ student }: StudentKpiCardsProps) {
  const { attendanceSummary, examResults, attendance, nextExam } = student;

  const attendedCount = attendance.filter((a) => isAttended(a.status)).length;
  const lastClass = attendance[0]?.session;

  const examCount = examResults.length;
  const examAverage =
    examCount === 0
      ? 0
      : Math.round(
          examResults.reduce(
            (acc, r) => acc + percentage(r.marks, r.exam.totalMarks),
            0,
          ) / examCount,
        );
  const latest = examResults[0];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        icon={TrendingUp}
        label="Attendance"
        value={`${attendanceSummary.percentage}%`}
        hint="Present"
        sub={`${attendanceSummary.present} / ${attendanceSummary.total} Classes`}
      />
      <Kpi
        icon={GraduationCap}
        label="Exam Average"
        value={examCount === 0 ? "—" : `${examAverage}%`}
        hint={latest ? "Last Exam" : "No exams yet"}
        sub={
          latest ? `${latest.marks} / ${latest.exam.totalMarks}` : undefined
        }
      />
      <Kpi
        icon={CalendarCheck}
        label="Classes Attended"
        value={attendedCount}
        hint={lastClass ? "Last Class" : "No sessions yet"}
        sub={
          lastClass ? relativeDay(new Date(lastClass.classDate)) : undefined
        }
      />
      <Kpi
        icon={ClipboardList}
        label="Upcoming Exam"
        value={
          nextExam ? (
            <span className="line-clamp-1 text-xl">{nextExam.title}</span>
          ) : (
            "—"
          )
        }
        hint={nextExam ? "Scheduled" : "Nothing scheduled"}
        sub={
          nextExam
            ? format(new Date(nextExam.examDate), "d MMM yyyy")
            : undefined
        }
      />
    </div>
  );
}
