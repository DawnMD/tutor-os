import { auth } from "@clerk/nextjs/server";
import { StudentDetailContent } from "./_components/student-detail-content";

export default async function BatchStudentDetailPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students/[studentId]">) {
  await auth.protect();

  const { classId, batchId, studentId } = await params;

  return (
    <StudentDetailContent
      classId={classId}
      batchId={batchId}
      studentId={studentId}
    />
  );
}
