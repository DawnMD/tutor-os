"use client";

import { AttendanceStatusBadge } from "@/components/student/attendance-status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { StudentRecentSession } from "@/lib/student-dashboard-stats";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { History } from "lucide-react";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

export function StudentRecentSessionsCard({
  sessions,
}: {
  sessions: StudentRecentSession[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No sessions yet.
          </p>
        ) : (
          <ul className="divide-y">
            {sessions.map((s) => (
              <li
                key={s.sessionId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    dotClass(s.colorId),
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.topic ?? `${s.className} · ${s.batchName}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.className} · {s.batchName} · {format(s.classDate, "MMM d")}
                  </p>
                </div>
                {s.status ? (
                  <AttendanceStatusBadge status={s.status} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
