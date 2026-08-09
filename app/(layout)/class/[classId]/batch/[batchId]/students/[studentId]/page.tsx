import type { Metadata } from "next";
import { StudentDetailContent } from "./_components/student-detail-content";
import { requireOwnerPage } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Student",
};

export default async function BatchStudentDetailPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students/[studentId]">) {
  await requireOwnerPage();

  const { classId, batchId, studentId } = await params;

  return (
    <StudentDetailContent
      classId={classId}
      batchId={batchId}
      studentId={studentId}
    />
  );
}
