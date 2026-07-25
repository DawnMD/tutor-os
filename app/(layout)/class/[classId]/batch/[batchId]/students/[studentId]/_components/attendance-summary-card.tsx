import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentDashboard } from "./utils";
import { ProgressRing } from "./progress-ring";

interface AttendanceSummaryCardProps {
  summary: StudentDashboard["attendanceSummary"];
}

const STATS: {
  key: "present" | "absent" | "late";
  label: string;
  dot: string;
}[] = [
  { key: "present", label: "Present", dot: "bg-emerald-500" },
  { key: "absent", label: "Absent", dot: "bg-destructive" },
  { key: "late", label: "Late", dot: "bg-amber-500" },
];

export function AttendanceSummaryCard({ summary }: AttendanceSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <ProgressRing value={summary.percentage} size={104} strokeWidth={9}>
          <span className="text-2xl font-bold leading-none">
            {summary.percentage}%
          </span>
          <span className="mt-1 text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Present
          </span>
        </ProgressRing>

        <div className="flex-1 space-y-3">
          {STATS.map((stat) => (
            <div key={stat.key} className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`size-2 rounded-full ${stat.dot}`} aria-hidden />
                {stat.label}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {summary[stat.key]}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total Classes</span>
            <span className="text-sm font-semibold tabular-nums">
              {summary.total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
