import { auth } from "@clerk/nextjs/server";
import AttendanceContent from "./_components/attendance-content";

export default async function BatchAttendancePage({
  params,
  searchParams,
}: PageProps<"/class/[classId]/batch/[batchId]/attendance">) {
  await auth.protect();
  const { batchId } = await params;
  const { session } = await searchParams;
  const initialSessionId = typeof session === "string" ? session : undefined;

  return (
    <AttendanceContent batchId={batchId} initialSessionId={initialSessionId} />
  );
}
