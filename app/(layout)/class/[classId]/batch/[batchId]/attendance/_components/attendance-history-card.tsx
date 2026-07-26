"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { ChevronRight, ListFilter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AttendanceSession,
  isConducted,
  SESSION_STATUS_META,
  sessionCounts,
  sessionDisplayStatus,
  sessionRate,
  sessionStatus,
  SessionStatus,
} from "./utils";

type StatusFilter = "all" | SessionStatus;

interface AttendanceHistoryCardProps {
  sessions: AttendanceSession[];
  activeSessionId: string | null;
  onSelect: (session: AttendanceSession) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All sessions" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
];

function rateColor(rate: number | null): string {
  if (rate === null) return "text-muted-foreground";
  if (rate >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function AttendanceHistoryCard({
  sessions,
  activeSessionId,
  onSelect,
}: AttendanceHistoryCardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Only conducted sessions belong in history; newest first (already sorted).
  const conducted = useMemo(
    () => sessions.filter(isConducted),
    [sessions],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conducted.filter((s) => {
      if (statusFilter !== "all" && sessionStatus(s) !== statusFilter) {
        return false;
      }
      if (term) {
        const hay = `${s.topic ?? ""} ${format(
          new Date(s.classDate),
          "d MMM yyyy",
        )}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [conducted, search, statusFilter]);

  const filtersActive = statusFilter !== "all" || search !== "";

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-0.5">
          <CardTitle className="text-base tracking-normal normal-case">
            Attendance History
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {conducted.length} past{" "}
            {conducted.length === 1 ? "session" : "sessions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InputGroup className="h-8 sm:w-56">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <ListFilter className="size-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {filtersActive && (
                    <span className="ml-0.5 size-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            {conducted.length === 0
              ? "No past sessions yet."
              : "No sessions match your filters."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Late
                </TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => {
                const counts = sessionCounts(session);
                const rate = sessionRate(session);
                const meta = SESSION_STATUS_META[sessionDisplayStatus(session)];
                const date = new Date(session.classDate);
                const active = session.id === activeSessionId;
                return (
                  <TableRow
                    key={session.id}
                    tabIndex={0}
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelect(session)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(session);
                      }
                    }}
                    className={cn(
                      "group cursor-pointer",
                      active && "bg-accent/60",
                    )}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(date, "d MMM yyyy")}
                          {isToday(date) && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              Today
                            </span>
                          )}
                        </span>
                        {session.topic && (
                          <span className="truncate text-xs text-muted-foreground">
                            {session.topic}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase",
                          meta.badge,
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", meta.dot)}
                        />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {counts.marked ? counts.present : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {counts.marked ? counts.absent : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {counts.marked ? counts.late : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold tabular-nums",
                        rateColor(rate),
                      )}
                    >
                      {rate === null ? "—" : `${rate}%`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`View session on ${format(
                          date,
                          "d MMM yyyy",
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(session);
                        }}
                        className={cn(active && "text-foreground")}
                      >
                        <span className="hidden sm:inline">
                          {active ? "Viewing" : "View"}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
