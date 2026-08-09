import type { Metadata } from "next";
import { requireOrganization } from "@/lib/roles";
import AttendanceContent from "./_components/attendance-content";
import { StudentAttendance } from "./_components/student-attendance";

export const metadata: Metadata = {
  title: "Attendance",
};

export default async function BatchAttendancePage({
  params,
  searchParams,
}: PageProps<"/class/[classId]/batch/[batchId]/attendance">) {
  const { isOwner } = await requireOrganization();
  const { batchId } = await params;

  if (isOwner) {
    const { session } = await searchParams;
    const initialSessionId = typeof session === "string" ? session : undefined;
    return (
      <AttendanceContent batchId={batchId} initialSessionId={initialSessionId} />
    );
  }

  return <StudentAttendance batchId={batchId} />;
}
