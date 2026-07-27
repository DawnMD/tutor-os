"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { StudentRecentResult } from "@/lib/student-dashboard-stats";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ClipboardCheck } from "lucide-react";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function StudentRecentResultsCard({
  results,
}: {
  results: StudentRecentResult[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          Recent results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No results yet.
          </p>
        ) : (
          <ul className="divide-y">
            {results.map((r) => (
              <li
                key={r.examId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    dotClass(r.colorId),
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.batchName} · {format(r.examDate, "MMM d")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-sm font-semibold", scoreColor(r.percentage))}>
                    {r.percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {r.marks}/{r.totalMarks}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
