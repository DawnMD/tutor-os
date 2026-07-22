"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Outputs } from "@/orpc/router";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface StudentSummaryCardProps {
  students: NonNullable<
    Outputs["owner"]["batch"]["getBatchDataById"]
  >["students"];
  totalStudents: number;
}

export default function StudentSummaryCard({
  students,
  totalStudents,
}: StudentSummaryCardProps) {
  const archivedStudents = students.filter(
    (bs) => bs.student.archivedAt,
  ).length;
  const recentlyJoined = [...students]
    .sort(
      (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
    )
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Student Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Total Students
            </span>
            <span className="text-lg font-semibold">{totalStudents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Archived</span>
            <span className="text-lg font-semibold">{archivedStudents}</span>
          </div>
        </div>

        {/* Recently Joined */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium">Recently Joined</p>
          {recentlyJoined.length > 0 ? (
            <div className="space-y-2">
              {recentlyJoined.map((bs) => (
                <div
                  key={bs.studentId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">
                    {bs.student.fullName || bs.student.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(bs.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No students yet</p>
          )}
        </div>

        {/* CTA */}
        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href={"/students"} />}
        >
          <span>View All Students</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
