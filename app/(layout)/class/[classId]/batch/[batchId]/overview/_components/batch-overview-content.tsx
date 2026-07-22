'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import {
  MoreVertical,
  Plus,
  Users,
  TrendingUp,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import BatchHeader from './batch-header';
import KPICards from './kpi-cards';
import TodaySessionCard from './today-session-card';
import WeeklyScheduleCard from './weekly-schedule-card';
import StudentSummaryCard from './student-summary-card';
import AttendanceChartCard from './attendance-chart-card';
import RecentSessionsCard from './recent-sessions-card';
import UpcomingExamsCard from './upcoming-exams-card';
import QuickActionsPanel from './quick-actions-panel';

interface BatchOverviewContentProps {
  batch: any;
}

export default function BatchOverviewContent({ batch }: BatchOverviewContentProps) {
  const totalStudents = batch.students.length;
  const activeStudents = batch.students.filter((bs: any) => !bs.student.archivedAt).length;

  return (
    <div className="space-y-6">
      {/* Batch Header */}
      <BatchHeader batch={batch} />

      {/* KPI Cards Grid */}
      <KPICards batch={batch} totalStudents={totalStudents} activeStudents={activeStudents} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Session Card */}
          <TodaySessionCard batch={batch} />

          {/* Weekly Schedule Card */}
          <WeeklyScheduleCard schedules={batch.schedules} />

          {/* Recent Sessions Card */}
          <RecentSessionsCard sessions={batch.sessions} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Student Summary */}
          <StudentSummaryCard students={batch.students} totalStudents={totalStudents} />

          {/* Upcoming Exams */}
          <UpcomingExamsCard exams={batch.exams} />

          {/* Quick Actions */}
          <QuickActionsPanel batchId={batch.id} classId={batch.classId} />
        </div>
      </div>

      {/* Attendance Chart */}
      <AttendanceChartCard sessions={batch.sessions} />
    </div>
  );
}
