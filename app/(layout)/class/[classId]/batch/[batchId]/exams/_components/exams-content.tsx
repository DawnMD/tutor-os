"use client";

import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getArchivedScope } from "@/lib/archived-error";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BatchArchivedState } from "../../_components/batch-archived-state";
import { DeleteExamDialog } from "./delete-exam-dialog";
import { ExamFormDialog, ExamFormMode } from "./exam-form-dialog";
import { ExamGradingCard } from "./exam-grading-card";
import { ExamList } from "./exam-list";
import { ExamsEmptyState } from "./exams-empty-state";
import { ExamsHeader } from "./exams-header";
import { ExamsKpiCards } from "./exams-kpi-cards";
import { ExamsSkeleton } from "./exams-skeleton";
import { ExamRow } from "./utils";

interface ExamsContentProps {
  batchId: string;
  /** When set (e.g. from an `?exam=` deep link), selects that exam's grid. */
  initialExamId?: string;
  /** When true (from `?create=1`), auto-opens the create dialog on mount. */
  autoCreate?: boolean;
}

export default function ExamsContent({
  batchId,
  initialExamId,
  autoCreate,
}: ExamsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: batch, isLoading, error } = useQuery(
    orpc.owner.exam.getExamsPage.queryOptions({ input: { batchId } }),
  );

  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    initialExamId ?? null,
  );
  const [formOpen, setFormOpen] = useState(Boolean(autoCreate));
  const [formMode, setFormMode] = useState<ExamFormMode>({ kind: "create" });
  // Bumped on every open so the form dialog remounts with fresh initial values.
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ExamRow | null>(null);

  if (isLoading) {
    return <ExamsSkeleton />;
  }

  const archivedScope = getArchivedScope(error);
  if (archivedScope === "batch" || archivedScope === "class") {
    return <BatchArchivedState scope={archivedScope} />;
  }

  if (!batch) {
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

  const totalStudents = batch._count.students;
  const selectedExam =
    batch.exams.find((e) => e.id === selectedExamId) ?? null;

  const openForm = (mode: ExamFormMode) => {
    setFormMode(mode);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const openCreate = () => openForm({ kind: "create" });
  const openEdit = (exam: ExamRow) => openForm({ kind: "edit", source: exam });

  const selectExam = (exam: ExamRow) => {
    setSelectedExamId(exam.id);
    // Reflect the selection in the URL so the grid survives a reload / share.
    const params = new URLSearchParams(searchParams.toString());
    params.set("exam", exam.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <ExamsHeader batch={batch} onCreate={openCreate} />

      <ExamsKpiCards batch={batch} />

      {batch.exams.length === 0 ? (
        <ExamsEmptyState onCreate={openCreate} />
      ) : (
        <ExamList
          exams={batch.exams}
          totalStudents={totalStudents}
          selectedExamId={selectedExam?.id ?? null}
          onSelect={selectExam}
          onGrade={selectExam}
          onEdit={openEdit}
          onDelete={(exam) => setDeleteTarget(exam)}
        />
      )}

      {selectedExam && (
        <ExamGradingCard
          key={selectedExam.id}
          batchId={batchId}
          examId={selectedExam.id}
        />
      )}

      <ExamFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        batchId={batchId}
        mode={formMode}
      />

      <DeleteExamDialog
        exam={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        batchId={batchId}
        onDeleted={(examId) => {
          if (selectedExamId === examId) setSelectedExamId(null);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
