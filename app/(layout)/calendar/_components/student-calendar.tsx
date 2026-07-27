"use client";

import { StudentGate } from "@/components/student/student-gate";
import { CalendarView } from "./calendar-view";

export function StudentCalendar() {
  return (
    <StudentGate>
      <CalendarView source="student" />
    </StudentGate>
  );
}
