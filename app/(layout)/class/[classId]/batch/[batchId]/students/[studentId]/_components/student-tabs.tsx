"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceTab } from "./attendance-tab";
import { ExamsTab } from "./exams-tab";
import { NotesTab } from "./notes-tab";
import { OverviewTab } from "./overview-tab";
import { SessionsTab } from "./sessions-tab";
import { StudentTab, useStudentActions } from "./student-actions";
import { TimelineTab } from "./timeline-tab";
import { StudentDashboard } from "./utils";

interface StudentTabsProps {
  student: StudentDashboard;
}

const TABS = [
  "Overview",
  "Attendance",
  "Exams",
  "Sessions",
  "Notes",
  "Timeline",
] as const;

export function StudentTabs({ student }: StudentTabsProps) {
  const { tab, setTab } = useStudentActions();

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as StudentTab)}
      className="gap-4"
    >
      <div className="sticky top-0 z-10 -mx-1 overflow-x-auto bg-background/95 px-1 py-1 backdrop-blur supports-backdrop-filter:bg-background/80">
        <TabsList variant="line" className="w-max">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="Overview">
        <OverviewTab student={student} />
      </TabsContent>
      <TabsContent value="Attendance">
        <AttendanceTab student={student} />
      </TabsContent>
      <TabsContent value="Exams">
        <ExamsTab examResults={student.examResults} />
      </TabsContent>
      <TabsContent value="Sessions">
        <SessionsTab attendance={student.attendance} />
      </TabsContent>
      <TabsContent value="Notes">
        <NotesTab />
      </TabsContent>
      <TabsContent value="Timeline">
        <TimelineTab student={student} />
      </TabsContent>
    </Tabs>
  );
}
