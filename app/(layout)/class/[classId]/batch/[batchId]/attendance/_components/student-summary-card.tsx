"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { AlertTriangle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AttendanceOverview,
  buildStudentSummaries,
  getInitials,
  LOW_ATTENDANCE_THRESHOLD,
} from "./utils";

interface StudentSummaryCardProps {
  overview: AttendanceOverview;
}

function barColor(rate: number, hasData: boolean): string {
  if (!hasData) return "bg-muted-foreground/30";
  if (rate >= 90) return "bg-emerald-500";
  if (rate >= LOW_ATTENDANCE_THRESHOLD) return "bg-amber-500";
  return "bg-rose-500";
}

export function StudentSummaryCard({ overview }: StudentSummaryCardProps) {
  const [search, setSearch] = useState("");
  const summaries = useMemo(
    () => buildStudentSummaries(overview),
    [overview],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return summaries;
    return summaries.filter((s) =>
      `${s.student.fullName ?? ""} ${s.student.email}`
        .toLowerCase()
        .includes(term),
    );
  }, [summaries, search]);

  const lowCount = summaries.filter(
    (s) => s.total > 0 && s.rate < LOW_ATTENDANCE_THRESHOLD,
  ).length;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-0.5">
          <CardTitle className="text-base tracking-normal normal-case">
            Student Summary
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {lowCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {lowCount} below {LOW_ATTENDANCE_THRESHOLD}%
              </span>
            ) : (
              "Sorted by attendance, lowest first"
            )}
          </p>
        </div>
        <InputGroup className="h-8 sm:w-56">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            {summaries.length === 0
              ? "No students in this batch yet."
              : "No students match your search."}
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map(({ student, counts, total, rate }) => {
              const hasData = total > 0;
              const low = hasData && rate < LOW_ATTENDANCE_THRESHOLD;
              return (
                <li
                  key={student.id}
                  className="flex items-center gap-3 px-5 py-3 sm:px-6"
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {getInitials(student.fullName, student.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {student.fullName || "Unnamed student"}
                      </p>
                      {low && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
                          <AlertTriangle className="size-2.5" />
                          Low
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", barColor(rate, hasData))}
                          style={{ width: `${hasData ? rate : 0}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {hasData
                          ? `${counts.present + counts.late}/${total} present`
                          : "No records"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        !hasData
                          ? "text-muted-foreground"
                          : low
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground",
                      )}
                    >
                      {hasData ? `${rate}%` : "—"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
