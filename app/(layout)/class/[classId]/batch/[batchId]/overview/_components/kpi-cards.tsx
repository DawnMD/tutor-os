"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Outputs } from "@/orpc/router";
import { BookOpen, Calendar, TrendingUp, Users } from "lucide-react";
import {
  attendedFromCounts,
  countStatuses,
  percentage,
} from "../../attendance/_components/utils";
import { examAveragePct } from "./utils";

interface KPICardsProps {
  batch: NonNullable<Outputs["owner"]["batch"]["getBatchDataById"]>;
  totalStudents: number;
  activeStudents: number;
}

export default function KPICards({
  batch,
  totalStudents,
  activeStudents,
}: KPICardsProps) {
  // Attendance rate across recorded sessions: present + late over students marked.
  const attendanceCounts = countStatuses(
    batch.sessions.flatMap((session) =>
      session.attendance.map((r) => r.status),
    ),
  );

  const getNextClass = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedules = batch.schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    if (schedules.length === 0) return null;

    const todayOfWeek = today.getDay();
    const nextSchedule =
      schedules.find((s) => s.dayOfWeek >= todayOfWeek) || schedules[0];
    return nextSchedule;
  };

  const getUpcomingExam = () => {
    const today = new Date();
    return batch.exams.find((exam) => new Date(exam.examDate) >= today);
  };

  const nextClass = getNextClass();
  const upcomingExam = getUpcomingExam();
  // When nothing is scheduled ahead, fall back to the latest graded exam.
  const latestGraded = upcomingExam
    ? null
    : batch.exams.find((exam) => examAveragePct(exam) != null);
  const latestGradedAvg = latestGraded ? examAveragePct(latestGraded) : null;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div
      data-tour="batch-kpis"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* Students Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Students</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            {activeStudents} active
          </p>
        </CardContent>
      </Card>

      {/* Attendance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">
            {attendanceCounts.marked === 0
              ? "—"
              : `${percentage(attendedFromCounts(attendanceCounts), attendanceCounts.marked)}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            {attendanceCounts.marked === 0
              ? "No attendance recorded"
              : "Last 10 sessions"}
          </p>
        </CardContent>
      </Card>

      {/* Next Class Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Next Class</CardTitle>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">
            {nextClass
              ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                  nextClass.dayOfWeek
                ]
              : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {nextClass
              ? `${formatTime(nextClass.startMinutes)} - ${formatTime(nextClass.endMinutes)}`
              : "No schedule"}
          </p>
        </CardContent>
      </Card>

      {/* Upcoming Exam Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Exam</CardTitle>
          <BookOpen className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold truncate">
            {upcomingExam
              ? upcomingExam.title
              : latestGradedAvg != null
                ? `${latestGradedAvg}%`
                : "None"}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {upcomingExam
              ? new Date(upcomingExam.examDate).toLocaleDateString()
              : latestGraded
                ? `${latestGraded.title} avg`
                : "No upcoming exams"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
