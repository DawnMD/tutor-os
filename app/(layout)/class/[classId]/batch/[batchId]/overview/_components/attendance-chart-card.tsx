"use client";

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
import { Outputs } from "@/orpc/router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  attendedFromCounts,
  countStatuses,
  percentage,
} from "../../attendance/_components/utils";

interface AttendanceChartCardProps {
  sessions: NonNullable<
    Outputs["owner"]["batch"]["getBatchDataById"]
  >["sessions"];
}

const chartConfig = {
  rate: {
    label: "Attendance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function AttendanceChartCard({
  sessions,
}: AttendanceChartCardProps) {
  // Oldest -> newest across the last 10 sessions.
  const last10Sessions = sessions.slice(0, 10).reverse();

  if (last10Sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-muted-foreground">No session data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = last10Sessions.map((session) => {
    const counts = countStatuses(session.attendance.map((r) => r.status));
    return {
      date: new Date(session.classDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      rate: counts.marked
        ? percentage(attendedFromCounts(counts), counts.marked)
        : null,
      present: attendedFromCounts(counts),
    };
  });

  const hasData = chartData.some((d) => d.rate != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
        <CardDescription>Last {last10Sessions.length} sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
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
  );
}
