"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { RecentActivity } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Activity } from "lucide-react";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

export function RecentActivityCard({ activity }: { activity: RecentActivity }) {
  const isEmpty =
    activity.sessions.length === 0 && activity.students.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <>
            {activity.sessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Completed sessions
                </p>
                <ul className="space-y-2">
                  {activity.sessions.map((s) => (
                    <li key={s.sessionId} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          dotClass(s.colorId),
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {s.topic ?? `${s.className} · ${s.batchName}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.presentCount}/{s.markedCount} present ·{" "}
                          {format(s.classDate, "MMM d")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activity.students.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recently joined
                </p>
                <ul className="space-y-2">
                  {activity.students.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <p className="truncate text-sm">
                        {student.fullName ?? student.email}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {format(new Date(student.createdAt), "MMM d")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
