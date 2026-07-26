"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { UpcomingExam } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

export function UpcomingExamsCard({ exams }: { exams: UpcomingExam[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          Upcoming exams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No exams scheduled.
          </p>
        ) : (
          <ul className="divide-y">
            {exams.map((exam) => (
              <li
                key={exam.examId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    dotClass(exam.colorId),
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{exam.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {exam.className} · {exam.batchName}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {format(exam.examDate, "EEE, MMM d")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
