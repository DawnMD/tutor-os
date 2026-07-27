"use client";

import { AttendanceStatusBadge } from "@/components/student/attendance-status-badge";
import { StudentArchivedState } from "@/components/student/student-archived-state";
import { StudentGate } from "@/components/student/student-gate";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getArchivedScope } from "@/lib/archived-error";
import {
  filterRecords,
  monthlyTrend,
  summarize,
  type AttendanceFilter,
} from "@/lib/student-attendance-stats";
import { orpc } from "@/orpc/client";
import { AttendanceStatus } from "@/prisma/generated/prisma/enums";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarX } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  rate: { label: "Attendance", color: "var(--chart-1)" },
} satisfies ChartConfig;

const FILTERS: { value: AttendanceFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: AttendanceStatus.PRESENT, label: "Present" },
  { value: AttendanceStatus.ABSENT, label: "Absent" },
  { value: AttendanceStatus.LATE, label: "Late" },
  { value: AttendanceStatus.EXCUSED, label: "Excused" },
];

export function StudentAttendance({ batchId }: { batchId: string }) {
  return (
    <StudentGate>
      <StudentAttendanceBody batchId={batchId} />
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

function StudentAttendanceBody({ batchId }: { batchId: string }) {
  const now = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState<AttendanceFilter>("ALL");

  const { data, isLoading, isError, error } = useQuery({
    ...orpc.student.attendance.getByBatch.queryOptions({ input: { batchId } }),
    retry: false,
  });

  const derived = useMemo(() => {
    if (!data) return null;
    return {
      summary: summarize(data.records),
      trend: monthlyTrend(data.records, now),
    };
  }, [data, now]);

  const visibleRecords = useMemo(
    () => (data ? filterRecords(data.records, filter) : []),
    [data, filter],
  );

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
            <CalendarX />
          </EmptyMedia>
          <EmptyTitle>Attendance not available</EmptyTitle>
          <EmptyDescription>
            This batch doesn&apos;t exist or you&apos;re not enrolled in it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { summary, trend } = derived;
  const hasTrend = trend.some((b) => b.rate != null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          title="Attendance rate"
          value={summary.rate == null ? "—" : `${summary.rate}%`}
          subtext={`${summary.total} sessions recorded`}
        />
        <KpiTile
          title="Present"
          value={String(summary.present + summary.late)}
          subtext={`${summary.late} late`}
        />
        <KpiTile
          title="Absent"
          value={String(summary.absent)}
          subtext="Missed sessions"
        />
        <KpiTile
          title="Excused"
          value={String(summary.excused)}
          subtext="Not counted in rate"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly trend</CardTitle>
          <CardDescription>Attendance rate over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <BarChart accessibilityLayer data={trend}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tickFormatter={(v) => `${v}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent formatter={(value) => `${value}%`} />
                  }
                />
                <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No attendance recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Attendance history</CardTitle>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as AttendanceFilter)}
          >
            <TabsList variant="line">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="px-0">
          {visibleRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-(--card-spacing)">Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-(--card-spacing)">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecords.map((rec) => (
                  <TableRow key={rec.session.id}>
                    <TableCell className="pl-(--card-spacing) font-medium">
                      {format(new Date(rec.session.classDate), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rec.session.topic || "—"}
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusBadge status={rec.status} />
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-muted-foreground">
                      {rec.remarks || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No records to show.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
