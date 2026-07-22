"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Outputs } from "@/orpc/router";
import { BookOpen, Calendar, TrendingUp, Users } from "lucide-react";

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
  // Calculate attendance percentage from sessions
  const getAttendancePercentage = () => {
    if (batch.sessions.length === 0) return 0;
    const latestSessions = batch.sessions.slice(0, 10);
    const totalAttendance = latestSessions.reduce((acc: number, session) => {
      return acc + session.attendance.length;
    }, 0);
    return latestSessions.length > 0
      ? Math.round(
          (totalAttendance / (latestSessions.length * activeStudents)) * 100,
        )
      : 0;
  };

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
  const attendancePercentage = getAttendancePercentage();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="text-2xl font-bold">{attendancePercentage}%</div>
          <p className="text-xs text-muted-foreground">Last 10 sessions</p>
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
            {upcomingExam ? upcomingExam.title.substring(0, 10) : "None"}
          </div>
          <p className="text-xs text-muted-foreground">
            {upcomingExam
              ? new Date(upcomingExam.examDate).toLocaleDateString()
              : "No upcoming exams"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
