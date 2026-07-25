"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "./empty-state";
import { useStudentActions } from "./student-actions";
import {
  gradeColor,
  gradeFromPercentage,
  percentage,
  StudentDashboard,
} from "./utils";

interface ExamsTabProps {
  examResults: StudentDashboard["examResults"];
}

export function ExamsTab({ examResults }: ExamsTabProps) {
  const { openAddExamResult } = useStudentActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exam Results</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {examResults.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-(--card-spacing)">Exam</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="pr-(--card-spacing)">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examResults.map((result) => {
                const pct = percentage(result.marks, result.exam.totalMarks);
                return (
                  <TableRow key={result.exam.id}>
                    <TableCell className="pl-(--card-spacing)">
                      <p className="font-medium">{result.exam.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(result.exam.examDate), "d MMM yyyy")}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {result.marks}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {result.exam.totalMarks}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${gradeColor(pct)}`}
                    >
                      {pct}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {gradeFromPercentage(pct)}
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-muted-foreground">
                      {result.remarks || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No exams yet"
            description="Once you publish exam results for this batch, this student's scores will appear here."
            actionLabel="Add Exam Result"
            onAction={openAddExamResult}
          />
        )}
      </CardContent>
    </Card>
  );
}
