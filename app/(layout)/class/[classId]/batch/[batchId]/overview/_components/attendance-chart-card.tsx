'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AttendanceChartCardProps {
  sessions: any[];
}

export default function AttendanceChartCard({ sessions }: AttendanceChartCardProps) {
  const last10Sessions = sessions.slice(0, 10).reverse();

  if (last10Sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-muted-foreground">No session data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate attendance for each session
  const chartData = last10Sessions.map((session: any) => {
    const attendanceCount = session.attendance.length;
    const percentage = attendanceCount > 0 ? Math.round((attendanceCount / 1) * 100) : 0;
    return {
      date: new Date(session.classDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: attendanceCount,
      percentage: Math.min(percentage, 100),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
        <CardDescription>Last {last10Sessions.length} sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((data: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{data.date}</span>
                <Badge variant="secondary">{data.count} present</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all rounded-full"
                  style={{ width: `${Math.min(data.percentage * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
