"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Outputs } from "@/orpc/router";
import { BookOpen, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { gradeColor, gradeFromPercentage } from "../../exams/_components/utils";
import { examAveragePct } from "./utils";
import { cn } from "@/lib/utils";

interface UpcomingExamsCardProps {
  exams: NonNullable<Outputs["owner"]["batch"]["getBatchDataById"]>["exams"];
  classId: string;
  batchId: string;
}

export default function UpcomingExamsCard({
  exams,
  classId,
  batchId,
}: UpcomingExamsCardProps) {
  const examsHref = `/class/${classId}/batch/${batchId}/exams`;
  const today = new Date();
  const upcomingExams = exams
    .filter((exam) => new Date(exam.examDate) >= today)
    .slice(0, 3);

  // Most recent exams that actually have graded results (exams arrive newest-first).
  const recentResults = exams
    .map((exam) => ({ exam, avg: examAveragePct(exam) }))
    .filter((r): r is { exam: (typeof exams)[number]; avg: number } =>
      r.avg != null,
    )
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Upcoming Exams</CardTitle>
            {upcomingExams.length > 0 && (
              <CardDescription>{upcomingExams.length} upcoming</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingExams.length > 0 ? (
          <>
            {upcomingExams.map((exam) => (
              <Link
                key={exam.id}
                href={`${examsHref}?exam=${exam.id}`}
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm truncate flex-1">
                    {exam.title}
                  </p>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {exam.totalMarks} marks
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </>
        ) : (
          <div className="text-center py-4">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No upcoming exams</p>
          </div>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Recent Results</p>
            {recentResults.map(({ exam, avg }) => (
              <Link
                key={exam.id}
                href={`${examsHref}?exam=${exam.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{exam.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <span
                  className={cn("text-sm font-semibold shrink-0", gradeColor(avg))}
                >
                  {avg}% · {gradeFromPercentage(avg)}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <Button
          variant="outline"
          nativeButton={false}
          className="w-full mt-2"
          render={<Link href={`${examsHref}?create=1`} />}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </CardContent>
    </Card>
  );
}
