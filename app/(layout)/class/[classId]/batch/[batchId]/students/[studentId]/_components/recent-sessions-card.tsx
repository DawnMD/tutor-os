import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { EmptyState } from "./empty-state";
import { StudentDashboard } from "./utils";

interface RecentSessionsCardProps {
  attendance: StudentDashboard["attendance"];
}

export function RecentSessionsCard({ attendance }: RecentSessionsCardProps) {
  const recent = attendance.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {recent.length > 0 ? (
          <ul className="divide-y">
            {recent.map((entry) => (
              <li
                key={entry.session.id}
                className="flex items-center justify-between gap-4 px-(--card-spacing) py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 flex-col items-center justify-center bg-muted text-center">
                    <span className="text-xs font-bold leading-none">
                      {format(new Date(entry.session.classDate), "dd")}
                    </span>
                    <span className="text-[0.5rem] font-semibold uppercase tracking-widest text-muted-foreground">
                      {format(new Date(entry.session.classDate), "MMM")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {entry.session.topic || "Untitled session"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.session.classDate), "EEE, d MMM")}
                    </p>
                  </div>
                </div>
                <AttendanceStatusBadge status={entry.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No sessions created"
            description="Sessions this student attends will appear here once you start marking attendance."
          />
        )}
      </CardContent>
    </Card>
  );
}
