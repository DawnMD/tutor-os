"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  examAverage,
  EXAM_STATUS_META,
  getExamStatus,
  gradeColor,
  gradedCount,
  ExamRow,
} from "./utils";

interface ExamListProps {
  exams: ExamRow[];
  totalStudents: number;
  selectedExamId: string | null;
  onSelect: (exam: ExamRow) => void;
  onGrade: (exam: ExamRow) => void;
  onEdit: (exam: ExamRow) => void;
  onDelete: (exam: ExamRow) => void;
}

export function ExamList({
  exams,
  totalStudents,
  selectedExamId,
  onSelect,
  onGrade,
  onEdit,
  onDelete,
}: ExamListProps) {
  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const statusMeta = EXAM_STATUS_META[getExamStatus(exam)];
        const graded = gradedCount(exam);
        const avg = examAverage(exam);
        const selected = exam.id === selectedExamId;

        return (
          <Card
            key={exam.id}
            size="sm"
            className={cn(
              "cursor-pointer ring-1 ring-foreground/5 transition-colors hover:ring-foreground/15",
              selected && "ring-2 ring-primary/40",
            )}
            onClick={() => onSelect(exam)}
          >
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Title + date */}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{exam.title}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase",
                      statusMeta.badge,
                    )}
                  >
                    <span
                      className={cn("size-1.5 rounded-full", statusMeta.dot)}
                    />
                    {statusMeta.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(exam.examDate), "EEEE, d MMMM yyyy")} ·{" "}
                  {exam.totalMarks} marks
                </p>
              </div>

              {/* Stats + actions */}
              <div className="flex items-center gap-4 sm:shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {graded}
                    <span className="font-medium text-muted-foreground">
                      {" "}
                      / {totalStudents}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">graded</p>
                </div>
                <div className="w-14 text-right">
                  {avg !== null ? (
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        gradeColor(avg),
                      )}
                    >
                      {avg}%
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                  <p className="text-xs text-muted-foreground">average</p>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Exam actions"
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onGrade(exam)}>
                        <ClipboardList className="size-4" />
                        Grade students
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(exam)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(exam)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
