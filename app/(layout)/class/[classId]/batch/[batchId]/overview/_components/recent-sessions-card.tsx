"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Outputs } from "@/orpc/router";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

interface RecentSessionsCardProps {
  sessions: NonNullable<
    Outputs["owner"]["batch"]["getBatchDataById"]
  >["sessions"];
  classId: string;
  batchId: string;
}

export default function RecentSessionsCard({
  sessions,
  classId,
  batchId,
}: RecentSessionsCardProps) {
  const recentSessions = sessions.slice(0, 5);
  const sessionsHref = `/class/${classId}/batch/${batchId}/sessions`;

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
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
          <CardDescription>
            Last {recentSessions.length} classes
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          size="sm"
          render={<Link href={sessionsHref} />}
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-start justify-between p-3 border hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">
                  {session.topic || "Class Session"}
                </p>
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
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={`${sessionsHref}?session=${session.id}`} />}
            >
              View
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
