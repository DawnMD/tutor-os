"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getArchivedScope } from "@/lib/archived-error";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { isToday } from "date-fns";
import { useState } from "react";
import { BatchArchivedState } from "../../_components/batch-archived-state";
import { AttendanceEmptyState } from "./attendance-empty-state";
import { AttendanceHeader } from "./attendance-header";
import { AttendanceHistoryCard } from "./attendance-history-card";
import { AttendanceKpiCards } from "./attendance-kpi-cards";
import { AttendanceSkeleton } from "./attendance-skeleton";
import { StudentSummaryCard } from "./student-summary-card";
import { TodayAttendanceCard } from "./today-attendance-card";
import { previousSession, resolveActiveSession } from "./utils";

interface AttendanceContentProps {
  batchId: string;
  /** When set (e.g. from a `?session=` deep link), opens that session. */
  initialSessionId?: string;
}

export default function AttendanceContent({
  batchId,
  initialSessionId,
}: AttendanceContentProps) {
  const { data: overview, isLoading, error } = useQuery(
    orpc.owner.attendance.getAttendanceOverview.queryOptions({
      input: { batchId },
    }),
  );

  // Which session is loaded in the marking card. `null` means "follow the
  // default" (today's / latest open) which is re-resolved on every render.
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSessionId ?? null,
  );

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  const archivedScope = getArchivedScope(error);
  if (archivedScope === "batch" || archivedScope === "class") {
    return <BatchArchivedState scope={archivedScope} />;
  }

  if (!overview) {
    return (
      <Card className="border-dashed py-0">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>Batch not found</EmptyTitle>
            <EmptyDescription>
              This batch may have been archived or you don&apos;t have access to
              it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  const hasTodaySession = overview.sessions.some((s) =>
    isToday(new Date(s.classDate)),
  );

  const defaultActive = resolveActiveSession(overview.sessions);
  const activeSession =
    (selectedId
      ? overview.sessions.find((s) => s.id === selectedId)
      : null) ?? defaultActive;

  const previous = activeSession
    ? previousSession(overview.sessions, activeSession)
    : null;

  return (
    <div className="space-y-6">
      <AttendanceHeader
        overview={overview}
        hasTodaySession={hasTodaySession}
      />

      <AttendanceKpiCards overview={overview} activeSession={activeSession} />

      {activeSession ? (
        <TodayAttendanceCard
          key={activeSession.id}
          batchId={batchId}
          session={activeSession}
          previous={previous}
          students={overview.students}
        />
      ) : (
        <AttendanceEmptyState
          batchId={batchId}
          hasStudents={overview.students.length > 0}
        />
      )}

      {overview.sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AttendanceHistoryCard
            sessions={overview.sessions}
            activeSessionId={activeSession?.id ?? null}
            onSelect={(session) => {
              setSelectedId(session.id);
              // Bring the marking card into view on smaller screens.
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
          <StudentSummaryCard overview={overview} />
        </div>
      )}

      {overview.students.length === 0 && overview.sessions.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Add students to this batch to start marking attendance.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
