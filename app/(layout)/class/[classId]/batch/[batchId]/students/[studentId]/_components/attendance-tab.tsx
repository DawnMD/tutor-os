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
import { CalendarX } from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { AttendanceSummaryCard } from "./attendance-summary-card";
import { EmptyState } from "./empty-state";
import { useStudentActions } from "./student-actions";
import { StudentDashboard } from "./utils";

interface AttendanceTabProps {
  student: StudentDashboard;
}

export function AttendanceTab({ student }: AttendanceTabProps) {
  const { openMarkAttendance } = useStudentActions();
  const { attendance, attendanceSummary } = student;

  return (
    <div className="space-y-4">
      <AttendanceSummaryCard summary={attendanceSummary} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {attendance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-(--card-spacing)">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-(--card-spacing)">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((entry) => (
                  <TableRow key={entry.session.id}>
                    <TableCell className="pl-(--card-spacing) font-medium">
                      {format(new Date(entry.session.classDate), "d MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-muted-foreground">
                      {entry.remarks || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={CalendarX}
              title="No attendance history"
              description="Start marking attendance for this batch's sessions to build a history."
              actionLabel="Mark Attendance"
              onAction={openMarkAttendance}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
