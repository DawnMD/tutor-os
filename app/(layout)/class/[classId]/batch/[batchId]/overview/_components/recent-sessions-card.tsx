'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, BookOpen } from 'lucide-react';

interface RecentSessionsCardProps {
  sessions: any[];
}

export default function RecentSessionsCard({ sessions }: RecentSessionsCardProps) {
  const recentSessions = sessions.slice(0, 5);

  if (recentSessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-muted-foreground">No sessions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Sessions</CardTitle>
        <CardDescription>Last {recentSessions.length} classes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentSessions.map((session: any) => (
          <div
            key={session.id}
            className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{session.topic || 'Class Session'}</p>
                {session.attendance.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Attendance Done
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{new Date(session.classDate).toLocaleDateString()}</span>
                {session.summary && (
                  <>
                    <span>•</span>
                    <BookOpen className="w-3 h-3" />
                    <span>Summary added</span>
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
