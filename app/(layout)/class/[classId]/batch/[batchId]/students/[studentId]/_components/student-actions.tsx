"use client";

import { orpc } from "@/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
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
  isArchived: boolean;
  openEdit: () => void;
  openMove: () => void;
  openArchive: () => void;
  unarchive: () => void;
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

  const queryClient = useQueryClient();
  const isArchived = Boolean(student.archivedAt);

  const { mutateAsync: unArchieveStudent } = useMutation(
    orpc.owner.student.unArchieveStudent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentDashboard.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.student.getAllStudents.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batchStudent.getStudentsByBatch.key(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.owner.batch.getBatchDataById.key(),
        });
      },
    }),
  );

  const value = useMemo<StudentActionsContextValue>(
    () => ({
      tab,
      setTab,
      isArchived,
      openEdit: () => setEditOpen(true),
      openMove: () => setMoveOpen(true),
      openArchive: () => setArchiveOpen(true),
      unarchive: () => {
        toast.promise(unArchieveStudent({ studentId }), {
          loading: "Restoring student...",
          success: "Student restored",
          error: (err) =>
            err instanceof Error ? err.message : "Failed to restore student",
        });
      },
      openMarkAttendance: () => setMarkAttendanceOpen(true),
      openAddExamResult: () => setAddExamResultOpen(true),
    }),
    [tab, isArchived, unArchieveStudent, studentId],
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
