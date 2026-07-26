"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BATCH_COLORS } from "@/lib/batch-colors";
import type { AttentionStudent } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

function dotClass(colorId: string) {
  return BATCH_COLORS.find((c) => c.id === colorId)?.dot ?? BATCH_COLORS[0].dot;
}

export function AttentionStudentsCard({
  students,
}: {
  students: AttentionStudent[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Students needing attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            All students are on track.
          </p>
        ) : (
          <ul className="divide-y">
            {students.map((s) => (
              <li key={s.studentId}>
                <Link
                  href={`/class/${s.classId}/batch/${s.batchId}/students/${s.studentId}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      dotClass(s.colorId),
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.batchName}
                      {s.consecutiveAbsences >= 2 &&
                        ` · ${s.consecutiveAbsences} absences in a row`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      s.rate < 60 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {s.rate}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
