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
import type { TrendBucket } from "@/lib/dashboard-stats";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  rate: {
    label: "Attendance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function AttendanceTrendCard({ data }: { data: TrendBucket[] }) {
  const hasData = data.some((b) => b.rate != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance trend</CardTitle>
        <CardDescription>Weekly attendance rate over 8 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
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
                  <ChartTooltipContent
                    formatter={(value) => `${value}%`}
                    labelFormatter={(label) => `Week of ${label}`}
                  />
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
