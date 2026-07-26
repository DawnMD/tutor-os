"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  Eraser,
  Lock,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExamDetail,
  EXAM_STATUS_META,
  getExamStatus,
  getInitials,
  gradeColor,
  gradeFromPercentage,
  percentage,
} from "./utils";

interface DraftRow {
  marks: string;
  remarks: string;
}

type DraftMap = Record<string, DraftRow>;

function buildDraft(detail: ExamDetail): DraftMap {
  const draft: DraftMap = {};
  for (const student of detail.students) {
    draft[student.id] = { marks: "", remarks: "" };
  }
  for (const result of detail.results) {
    draft[result.studentId] = {
      marks: String(result.marks),
      remarks: result.remarks ?? "",
    };
  }
  return draft;
}

function draftEquals(a: DraftMap, b: DraftMap, ids: string[]): boolean {
  return ids.every((id) => {
    const x = a[id];
    const y = b[id];
    return (
      (x?.marks ?? "") === (y?.marks ?? "") &&
      (x?.remarks ?? "") === (y?.remarks ?? "")
    );
  });
}

interface ExamGradingCardProps {
  batchId: string;
  examId: string;
}

/**
 * Bulk marks entry for one exam. Holds a local draft (marks as strings so a
 * blank cell is representable) and persists every non-blank row in one call.
 * Remounted by the parent (keyed on exam id) whenever a different exam opens.
 */
export function ExamGradingCard({ batchId, examId }: ExamGradingCardProps) {
  const queryClient = useQueryClient();
  const { data: detail, isLoading } = useQuery(
    orpc.owner.exam.getExamDetail.queryOptions({ input: { examId } }),
  );

  if (isLoading || !detail) {
    return <GradingSkeleton />;
  }

  return (
    <GradingGrid
      key={detail.id}
      batchId={batchId}
      detail={detail}
      queryClient={queryClient}
    />
  );
}

function GradingGrid({
  batchId,
  detail,
  queryClient,
}: {
  batchId: string;
  detail: ExamDetail;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const initial = useMemo(() => buildDraft(detail), [detail]);
  const [draft, setDraft] = useState<DraftMap>(() => buildDraft(detail));
  const [remarksOpen, setRemarksOpen] = useState<Set<string>>(() => {
    const open = new Set<string>();
    for (const result of detail.results) {
      if (result.remarks) open.add(result.studentId);
    }
    return open;
  });

  const studentIds = useMemo(
    () => detail.students.map((s) => s.id),
    [detail.students],
  );

  const saveMutation = useMutation(
    orpc.owner.exam.saveExamResults.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.exam.getExamsPage.queryKey({
            input: { batchId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.exam.getExamDetail.queryKey({
            input: { examId: detail.id },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentDashboard.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.dashboard.getDashboardData.key(),
        });
      },
    }),
  );

  const setMarks = (studentId: string, marks: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { marks, remarks: prev[studentId]?.remarks ?? "" },
    }));
  };
  const setRemarks = (studentId: string, remarks: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { marks: prev[studentId]?.marks ?? "", remarks },
    }));
  };
  const toggleRemarks = (studentId: string) => {
    setRemarksOpen((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const clearAll = () => {
    setDraft(() => {
      const next: DraftMap = {};
      for (const id of studentIds) next[id] = { marks: "", remarks: "" };
      return next;
    });
    setRemarksOpen(new Set());
  };

  const reset = () => {
    setDraft(buildDraft(detail));
    const open = new Set<string>();
    for (const result of detail.results) {
      if (result.remarks) open.add(result.studentId);
    }
    setRemarksOpen(open);
  };

  /** Parse a draft cell → validity. Blank is valid (just not submitted). */
  const rowState = (id: string) => {
    const raw = draft[id]?.marks ?? "";
    const trimmed = raw.trim();
    if (trimmed === "") return { blank: true, invalid: false, value: null };
    const value = Number(trimmed);
    const invalid =
      Number.isNaN(value) || value < 0 || value > detail.totalMarks;
    return { blank: false, invalid, value: invalid ? null : value };
  };

  const completed = Boolean(detail.completedAt);
  const statusMeta = EXAM_STATUS_META[getExamStatus(detail)];
  const dirty = !draftEquals(draft, initial, studentIds);
  const gradedCountDraft = studentIds.filter(
    (id) => !rowState(id).blank,
  ).length;
  const hasInvalid = studentIds.some((id) => rowState(id).invalid);

  const persist = (complete?: boolean) => {
    if (hasInvalid) {
      toast.error(`Every mark must be between 0 and ${detail.totalMarks}.`);
      return;
    }
    const results = studentIds
      .map((id) => ({ id, state: rowState(id) }))
      .filter(({ state }) => !state.blank && state.value !== null)
      .map(({ id, state }) => ({
        studentId: id,
        marks: state.value as number,
        remarks: draft[id]?.remarks.trim() || undefined,
      }));

    if (results.length === 0) {
      toast.error("Enter marks for at least one student before saving.");
      return;
    }

    toast.promise(
      saveMutation.mutateAsync({ examId: detail.id, results, complete }),
      {
        loading: complete ? "Saving & completing..." : "Saving marks...",
        success: complete ? "Marks saved · exam completed" : "Marks saved",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to save marks",
      },
    );
  };

  const reopen = () => {
    toast.promise(
      saveMutation.mutateAsync({
        examId: detail.id,
        results: [],
        complete: false,
      }),
      {
        loading: "Reopening exam...",
        success: "Exam reopened for editing",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to reopen exam",
      },
    );
  };

  const date = new Date(detail.examDate);

  return (
    <Card className="gap-0 overflow-visible py-0">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase",
                statusMeta.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusMeta.dot)} />
              {statusMeta.label}
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            {detail.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(date, "EEEE, d MMMM yyyy")} · {detail.totalMarks} marks
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">
            {gradedCountDraft}
            <span className="text-base font-medium text-muted-foreground">
              {" "}
              / {detail.students.length}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">graded</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-5 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={gradedCountDraft === 0 || completed}
        >
          <Eraser className="size-4" />
          Clear
        </Button>
      </div>

      {/* Student list */}
      <CardContent className="p-0">
        <ul className="divide-y">
          {detail.students.map((student, index) => {
            const entry = draft[student.id];
            const state = rowState(student.id);
            const remarksVisible = remarksOpen.has(student.id);
            const pct =
              state.value !== null
                ? percentage(state.value, detail.totalMarks)
                : null;

            return (
              <li key={student.id}>
                <div className="flex flex-col gap-3 px-5 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:px-6">
                  {/* Identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <Avatar size="sm">
                      <AvatarFallback>
                        {getInitials(student.fullName, student.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {student.fullName || "Unnamed student"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Marks + grade + remarks toggle */}
                  <div className="flex items-center gap-3 sm:shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={detail.totalMarks}
                        aria-invalid={state.invalid}
                        aria-label={`Marks for ${student.fullName || student.email}`}
                        className="h-8 w-20 tabular-nums"
                        value={entry?.marks ?? ""}
                        onChange={(e) =>
                          setMarks(student.id, e.target.value)
                        }
                        readOnly={completed}
                        placeholder="—"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {detail.totalMarks}
                      </span>
                    </div>

                    <div className="w-20 text-right">
                      {state.invalid ? (
                        <span className="text-xs font-medium text-destructive">
                          Out of range
                        </span>
                      ) : pct !== null ? (
                        <span
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            gradeColor(pct),
                          )}
                        >
                          {pct}% · {gradeFromPercentage(pct)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Add remark"
                      disabled={completed && !entry?.remarks}
                      onClick={() => toggleRemarks(student.id)}
                      className={cn(
                        "size-8 shrink-0",
                        (remarksVisible || entry?.remarks) && "text-foreground",
                      )}
                    >
                      <MessageSquare className="size-4" />
                    </Button>
                  </div>
                </div>

                {remarksVisible && (
                  <div className="px-5 pb-3 sm:pr-6 sm:pl-17">
                    <InputGroup className="h-8">
                      <InputGroupAddon>
                        <MessageSquare className="size-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={entry?.remarks ?? ""}
                        onChange={(e) =>
                          setRemarks(student.id, e.target.value)
                        }
                        readOnly={completed}
                        placeholder="Add a remark (optional)"
                      />
                    </InputGroup>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {detail.students.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No active students in this batch yet.
          </p>
        )}
      </CardContent>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t bg-card/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5 md:static md:bg-card md:backdrop-blur-none">
        <p className="text-xs text-muted-foreground">
          {completed ? (
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              Completed &amp; locked — reopen to make changes
            </span>
          ) : hasInvalid ? (
            <span className="text-destructive">
              Some marks are out of range
            </span>
          ) : dirty ? (
            <span className="text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          ) : (
            "All changes saved"
          )}
        </p>
        {completed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={reopen}
            disabled={saveMutation.isPending}
          >
            <RotateCcw className="size-4" />
            Reopen to edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={!dirty || saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => persist()}
              disabled={hasInvalid || saveMutation.isPending}
            >
              Save marks
            </Button>
            <Button
              size="sm"
              onClick={() => persist(true)}
              disabled={hasInvalid || saveMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              Save &amp; Complete
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function GradingSkeleton() {
  return (
    <Card className="gap-0 overflow-visible py-0">
      <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}
