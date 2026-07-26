"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SessionDetailDrawer } from "./session-detail-drawer";
import {
  SessionFormDialog,
  SessionFormMode,
} from "./session-form-dialog";
import { SessionTimeline } from "./session-timeline";
import { SessionsEmptyState } from "./sessions-empty-state";
import { SessionsHeader } from "./sessions-header";
import { SessionsKpiCards } from "./sessions-kpi-cards";
import { SessionsSkeleton } from "./sessions-skeleton";
import {
  SessionFilters,
  SessionsToolbar,
} from "./sessions-toolbar";
import { getSessionStatus, isAttendancePending, Session } from "./utils";

const PAGE_SIZE = 8;

interface SessionsContentProps {
  classId: string;
  batchId: string;
  /** When set (e.g. from a `?session=` deep link), opens that session's drawer. */
  initialSessionId?: string;
}

export default function SessionsContent({
  classId,
  batchId,
  initialSessionId,
}: SessionsContentProps) {
  const router = useRouter();
  const { data: batch, isLoading } = useQuery(
    orpc.owner.batchSession.getSessionsPage.queryOptions({
      input: { batchId },
    }),
  );

  const [filters, setFilters] = useState<SessionFilters>({
    search: "",
    status: "all",
    pendingOnly: false,
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialSessionId));
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<SessionFormMode>({ kind: "create" });
  // Bumped on every open so the form dialog remounts with fresh initial values.
  const [formKey, setFormKey] = useState(0);

  const filtered = useMemo(() => {
    if (!batch) return [];
    const term = filters.search.trim().toLowerCase();
    const result = batch.sessions.filter((s) => {
      if (
        term &&
        !`${s.topic ?? ""} ${s.summary ?? ""}`.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (filters.status !== "all" && getSessionStatus(s) !== filters.status) {
        return false;
      }
      if (filters.pendingOnly && !isAttendancePending(s)) {
        return false;
      }
      return true;
    });
    // Sessions arrive newest-first from the API.
    return filters.sort === "oldest" ? [...result].reverse() : result;
  }, [batch, filters]);

  if (isLoading) {
    return <SessionsSkeleton />;
  }

  if (!batch) {
    return (
      <Card className="border-dashed py-0">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>Batch not found</EmptyTitle>
            <EmptyDescription>
              This batch may have been archived or you don&apos;t have access
              to it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  const totalStudents = batch._count.students;
  const selected =
    batch.sessions.find((s) => s.id === selectedId) ?? null;

  const updateFilters = (next: Partial<SessionFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  const openForm = (mode: SessionFormMode) => {
    setFormMode(mode);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const openCreate = (date?: Date) => openForm({ kind: "create", date });
  const openEdit = (session: Session) => openForm({ kind: "edit", source: session });
  const openDuplicate = (session: Session) =>
    openForm({ kind: "duplicate", source: session });
  const openView = (session: Session) => {
    setSelectedId(session.id);
    setDrawerOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <SessionsHeader
        batch={batch}
        onCreate={() => openCreate()}
        onStartToday={() => openCreate(new Date())}
      />

      <SessionsKpiCards batch={batch} />

      {batch.sessions.length === 0 ? (
        <SessionsEmptyState onCreate={() => openCreate()} />
      ) : (
        <>
          <SessionsToolbar
            filters={filters}
            onChange={updateFilters}
            activeCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <Card className="border-dashed py-0">
              <Empty className="py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-11 rounded-full">
                    <SearchX className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No matching sessions</EmptyTitle>
                  <EmptyDescription>
                    Try adjusting your search or filters to find what you&apos;re
                    looking for.
                  </EmptyDescription>
                </EmptyHeader>
                <Button
                  variant="outline"
                  onClick={() =>
                    updateFilters({
                      search: "",
                      status: "all",
                      pendingOnly: false,
                    })
                  }
                >
                  Clear filters
                </Button>
              </Empty>
            </Card>
          ) : (
            <SessionTimeline
              sessions={paginated}
              totalStudents={totalStudents}
              onView={openView}
              onEdit={openEdit}
              onDuplicate={openDuplicate}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <SessionDetailDrawer
        session={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        batchId={batchId}
        schedules={batch.schedules}
        totalStudents={totalStudents}
        onEdit={(session) => {
          setDrawerOpen(false);
          openEdit(session);
        }}
        onViewAttendance={(session) =>
          router.push(
            `/class/${classId}/batch/${batchId}/attendance?session=${session.id}`,
          )
        }
      />

      <SessionFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        batchId={batchId}
        mode={formMode}
      />
    </div>
  );
}
