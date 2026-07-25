import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  GraduationCap,
  History,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "./empty-state";
import {
  ATTENDANCE_STATUS_STYLES,
  percentage,
  StudentDashboard,
} from "./utils";

interface TimelineTabProps {
  student: StudentDashboard;
}

type TimelineEvent = {
  id: string;
  date: Date;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
};

export function TimelineTab({ student }: TimelineTabProps) {
  const events: TimelineEvent[] = [];

  const membership = student.batches[0];
  if (membership) {
    events.push({
      id: "joined",
      date: new Date(membership.joinedAt),
      icon: UserPlus,
      iconClassName: "text-sky-600 dark:text-sky-400",
      title: "Joined batch",
      description: `Enrolled in ${membership.batch.name}`,
    });
  }

  for (const entry of student.attendance) {
    const style = ATTENDANCE_STATUS_STYLES[entry.status];
    events.push({
      id: `att-${entry.session.id}`,
      date: new Date(entry.session.classDate),
      icon: CheckCircle2,
      iconClassName: style.className,
      title: `Attendance marked · ${style.label}`,
      description: entry.session.topic || "Session attendance recorded",
    });
  }

  for (const result of student.examResults) {
    const pct = percentage(result.marks, result.exam.totalMarks);
    events.push({
      id: `exam-${result.exam.id}`,
      date: new Date(result.exam.examDate),
      icon: GraduationCap,
      iconClassName: "text-violet-600 dark:text-violet-400",
      title: "Exam result published",
      description: `${result.exam.title} · ${result.marks}/${result.exam.totalMarks} (${pct}%)`,
    });
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={History}
            title="Nothing here yet"
            description="Activity like attendance, exam results, and enrolment updates will show up on this timeline."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <ol className="relative">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            return (
              <li key={event.id} className="flex gap-4 pb-6 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center bg-muted">
                    <event.icon className={cn("size-4", event.iconClassName)} />
                  </span>
                  {!isLast && (
                    <span
                      className="mt-1 w-px flex-1 bg-border"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0 pt-1.5">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(event.date, "d MMM yyyy")} ·{" "}
                    {formatDistanceToNow(event.date, { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
