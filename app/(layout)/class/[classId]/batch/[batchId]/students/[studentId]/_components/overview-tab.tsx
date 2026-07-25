import { AttendanceSummaryCard } from "./attendance-summary-card";
import { LatestExamCard } from "./latest-exam-card";
import { NotesCard } from "./notes-card";
import { RecentSessionsCard } from "./recent-sessions-card";
import { StudentInfoCard } from "./student-info-card";
import { StudentDashboard } from "./utils";

interface OverviewTabProps {
  student: StudentDashboard;
}

export function OverviewTab({ student }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <StudentInfoCard student={student} />
      <AttendanceSummaryCard summary={student.attendanceSummary} />
      <LatestExamCard latestExam={student.latestExam} />
      <RecentSessionsCard attendance={student.attendance} />
      <div className="xl:col-span-2">
        <NotesCard />
      </div>
    </div>
  );
}
