"use client";

import { StudentArchivedState } from "@/components/student/student-archived-state";
import { StudentGate } from "@/components/student/student-gate";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getArchivedScope } from "@/lib/archived-error";
import { cn } from "@/lib/utils";
import {
  examKpis,
  performanceTrend,
  splitExams,
} from "@/lib/student-exam-stats";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  percentage: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

function scoreColor(pct: number) {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function StudentExams({ batchId }: { batchId: string }) {
  return (
    <StudentGate>
      <StudentExamsBody batchId={batchId} />
    </StudentGate>
  );
}

function KpiTile({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function StudentExamsBody({ batchId }: { batchId: string }) {
  const now = useMemo(() => new Date(), []);

  const { data, isLoading, isError, error } = useQuery({
    ...orpc.student.exam.getByBatch.queryOptions({ input: { batchId } }),
    retry: false,
  });

  const derived = useMemo(() => {
    if (!data) return null;
    const split = splitExams(data, now);
    return {
      split,
      kpis: examKpis(split),
      trend: performanceTrend(split.results),
    };
  }, [data, now]);

  if (isLoading || !derived) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (isError) {
    const scope = getArchivedScope(error);
    if (scope === "batch" || scope === "class") {
      return <StudentArchivedState scope={scope} />;
    }
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GraduationCap />
          </EmptyMedia>
          <EmptyTitle>Exam results not available</EmptyTitle>
          <EmptyDescription>
            This batch doesn&apos;t exist or you&apos;re not enrolled in it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { split, kpis, trend } = derived;
  const isEmpty = split.upcoming.length === 0 && split.results.length === 0;

  if (isEmpty) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GraduationCap />
          </EmptyMedia>
          <EmptyTitle>No exams yet</EmptyTitle>
          <EmptyDescription>
            When your tutor schedules exams for this batch, they&apos;ll appear
            here along with your results.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          title="Average"
          value={kpis.average == null ? "—" : `${kpis.average}%`}
          subtext={`${kpis.graded} graded`}
        />
        <KpiTile
          title="Best score"
          value={kpis.best == null ? "—" : `${kpis.best}%`}
          subtext="Across graded exams"
        />
        <KpiTile
          title="Graded"
          value={String(kpis.graded)}
          subtext="Results received"
        />
        <KpiTile
          title="Upcoming"
          value={String(kpis.upcoming)}
          subtext="Scheduled ahead"
        />
      </div>

      {trend.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance trend</CardTitle>
            <CardDescription>Your score across graded exams</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <LineChart accessibilityLayer data={trend} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: string) =>
                    v.length > 10 ? `${v.slice(0, 10)}…` : v
                  }
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent formatter={(value) => `${value}%`} />
                  }
                />
                <Line
                  dataKey="percentage"
                  type="monotone"
                  stroke="var(--color-percentage)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {split.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming exams</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {split.upcoming.map((exam) => (
                <li
                  key={exam.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Out of {exam.totalMarks} marks
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {format(exam.examDate, "EEE, MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {split.results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-(--card-spacing)">Exam</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead className="pr-(--card-spacing)">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {split.results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-(--card-spacing) font-medium">
                      {r.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(r.examDate, "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.pending ? (
                        <Badge variant="secondary">Pending</Badge>
                      ) : (
                        `${r.marks}/${r.totalMarks}`
                      )}
                    </TableCell>
                    <TableCell>
                      {r.percentage == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            "font-semibold",
                            scoreColor(r.percentage),
                          )}
                        >
                          {r.percentage}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-muted-foreground">
                      {r.remarks || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No results yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
