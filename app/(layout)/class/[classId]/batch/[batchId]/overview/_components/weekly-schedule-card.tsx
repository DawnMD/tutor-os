"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { Outputs } from "@/orpc/router";

interface WeeklyScheduleCardProps {
  schedules: NonNullable<
    Outputs["owner"]["batch"]["getBatchDataById"]
  >["schedules"];
}

export default function WeeklyScheduleCard({
  schedules,
}: WeeklyScheduleCardProps) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayShorts = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const sortedSchedules = [...schedules].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  if (sortedSchedules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-muted-foreground">No weekly schedule set</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-12 text-center">
                  {dayShorts[schedule.dayOfWeek]}
                </Badge>
                <div>
                  <p className="font-medium text-sm">
                    {daysOfWeek[schedule.dayOfWeek]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(schedule.startMinutes)} –{" "}
                    {formatTime(schedule.endMinutes)}
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
