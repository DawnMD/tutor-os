'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TodaySessionCardProps {
  batch: any;
}

export default function TodaySessionCard({ batch }: TodaySessionCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's session
  const todaySession = batch.sessions.find((session: any) => {
    const sessionDate = new Date(session.classDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  // Find today's schedule
  const todaySchedule = batch.schedules.find(
    (schedule: any) => schedule.dayOfWeek === today.getDay()
  );

  if (!todaySchedule) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No class scheduled for today</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const attendanceCount = todaySession?.attendance.length || 0;
  const totalStudents = batch.students.length;
  const attendancePercentage =
    totalStudents > 0 ? Math.round((attendanceCount / totalStudents) * 100) : 0;

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Today&apos;s Session</CardTitle>
            <CardDescription>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
          </div>
          {todaySession && (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Details */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Time</p>
            <p className="font-semibold">
              {formatTime(todaySchedule.startMinutes)} - {formatTime(todaySchedule.endMinutes)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Topic</p>
            <p className="font-semibold text-sm">{todaySession?.topic || 'Not set'}</p>
          </div>
          {todaySession && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Attendance</p>
              <p className="font-semibold">
                {attendanceCount}/{totalStudents} ({attendancePercentage}%)
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {todaySession && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Attendance Progress</span>
              <span className="font-medium">{attendancePercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all rounded-full"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {!todaySession ? (
            <Button className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1">
                Mark Attendance
              </Button>
              <Button variant="outline" className="flex-1">
                View Session
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
