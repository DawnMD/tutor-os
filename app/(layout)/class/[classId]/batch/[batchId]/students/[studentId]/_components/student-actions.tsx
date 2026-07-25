"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { AddExamResultDialog } from "./add-exam-result-dialog";
import { ArchiveStudentDialog } from "./archive-student-dialog";
import { EditStudentDialog } from "./edit-student-dialog";
import { MarkAttendanceDialog } from "./mark-attendance-dialog";
import { MoveBatchDialog } from "./move-batch-dialog";
import { StudentDashboard } from "./utils";

export type StudentTab =
  | "Overview"
  | "Attendance"
  | "Exams"
  | "Sessions"
  | "Notes"
  | "Timeline";

interface StudentActionsContextValue {
  tab: StudentTab;
  setTab: (tab: StudentTab) => void;
  openEdit: () => void;
  openMove: () => void;
  openArchive: () => void;
  openMarkAttendance: () => void;
  openAddExamResult: () => void;
}

const StudentActionsContext = createContext<StudentActionsContextValue | null>(
  null,
);

export function useStudentActions() {
  const context = useContext(StudentActionsContext);
  if (!context) {
    throw new Error(
      "useStudentActions must be used within a StudentActionsProvider",
    );
  }
  return context;
}

interface StudentActionsProviderProps {
  student: StudentDashboard;
  classId: string;
  batchId: string;
  studentId: string;
  children: React.ReactNode;
}

export function StudentActionsProvider({
  student,
  classId,
  batchId,
  studentId,
  children,
}: StudentActionsProviderProps) {
  const [tab, setTab] = useState<StudentTab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
  const [addExamResultOpen, setAddExamResultOpen] = useState(false);

  const value = useMemo<StudentActionsContextValue>(
    () => ({
      tab,
      setTab,
      openEdit: () => setEditOpen(true),
      openMove: () => setMoveOpen(true),
      openArchive: () => setArchiveOpen(true),
      openMarkAttendance: () => setMarkAttendanceOpen(true),
      openAddExamResult: () => setAddExamResultOpen(true),
    }),
    [tab],
  );

  return (
    <StudentActionsContext.Provider value={value}>
      {children}

      <EditStudentDialog
        open={editOpen}
        setOpen={setEditOpen}
        student={student}
        batchId={batchId}
        studentId={studentId}
      />
      <MoveBatchDialog
        open={moveOpen}
        setOpen={setMoveOpen}
        batchId={batchId}
        studentId={studentId}
      />
      <ArchiveStudentDialog
        open={archiveOpen}
        setOpen={setArchiveOpen}
        student={student}
        classId={classId}
        batchId={batchId}
        studentId={studentId}
      />
      <MarkAttendanceDialog
        open={markAttendanceOpen}
        setOpen={setMarkAttendanceOpen}
        batchId={batchId}
        studentId={studentId}
      />
      <AddExamResultDialog
        open={addExamResultOpen}
        setOpen={setAddExamResultOpen}
        batchId={batchId}
        studentId={studentId}
      />
    </StudentActionsContext.Provider>
  );
}
