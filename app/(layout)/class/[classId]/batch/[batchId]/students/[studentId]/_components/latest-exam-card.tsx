"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import { useStudentActions } from "./student-actions";
import { EmptyState } from "./empty-state";
import {
  gradeColor,
  gradeFromPercentage,
  percentage,
  StudentDashboard,
} from "./utils";

interface LatestExamCardProps {
  latestExam: StudentDashboard["latestExam"];
}

export function LatestExamCard({ latestExam }: LatestExamCardProps) {
  const { setTab, openAddExamResult } = useStudentActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Latest Exam</CardTitle>
      </CardHeader>
      <CardContent>
        {latestExam ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{latestExam.exam.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(latestExam.exam.examDate), "d MMM yyyy")}
                </p>
              </div>
              {(() => {
                const pct = percentage(
                  latestExam.marks,
                  latestExam.exam.totalMarks,
                );
                return (
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${gradeColor(pct)}`}>
                      {pct}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Grade {gradeFromPercentage(pct)}
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-none bg-border text-center">
              <div className="bg-card px-3 py-3">
                <p className="text-lg font-bold tabular-nums">
                  {latestExam.marks}
                </p>
                <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Marks
                </p>
              </div>
              <div className="bg-card px-3 py-3">
                <p className="text-lg font-bold tabular-nums">
                  {latestExam.exam.totalMarks}
                </p>
                <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  Total
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setTab("Exams")}
            >
              View Results
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No exams yet"
            description="Record this student's first exam result to start tracking performance."
            actionLabel="Add Exam Result"
            onAction={openAddExamResult}
          />
        )}
      </CardContent>
    </Card>
  );
}
