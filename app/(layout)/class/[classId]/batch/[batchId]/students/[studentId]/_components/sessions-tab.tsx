import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { CalendarClock, NotebookPen } from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { EmptyState } from "./empty-state";
import { StudentDashboard } from "./utils";

interface SessionsTabProps {
  attendance: StudentDashboard["attendance"];
}

export function SessionsTab({ attendance }: SessionsTabProps) {
  if (attendance.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={CalendarClock}
            title="No sessions created"
            description="Sessions created for this batch will show up here once attendance is marked."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {attendance.map((entry) => (
        <Card key={entry.session.id} size="sm">
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {entry.session.topic || "Untitled session"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.session.classDate), "EEEE, d MMM yyyy")}
                </p>
              </div>
              <AttendanceStatusBadge status={entry.status} />
            </div>

            {entry.session.summary && (
              <>
                <Separator />
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <NotebookPen className="mt-0.5 size-4 shrink-0" />
                  <p>{entry.session.summary}</p>
                </div>
              </>
            )}

            {entry.remarks && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Remark:</span>{" "}
                {entry.remarks}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
