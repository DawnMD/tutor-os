import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/roles";
import AttendanceContent from "./_components/attendance-content";
import { StudentAttendance } from "./_components/student-attendance";

export default async function BatchAttendancePage({
  params,
  searchParams,
}: PageProps<"/class/[classId]/batch/[batchId]/attendance">) {
  await auth.protect();
  const { batchId } = await params;

  if (await isOwner()) {
    const { session } = await searchParams;
    const initialSessionId = typeof session === "string" ? session : undefined;
    return (
      <AttendanceContent batchId={batchId} initialSessionId={initialSessionId} />
    );
  }

  return <StudentAttendance batchId={batchId} />;
}
