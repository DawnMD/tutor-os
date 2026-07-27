import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/roles";
import ExamsContent from "./_components/exams-content";
import { StudentExams } from "./_components/student-exams";

export default async function BatchExamsPage({
  params,
  searchParams,
}: PageProps<"/class/[classId]/batch/[batchId]/exams">) {
  await auth.protect();
  const { batchId } = await params;

  if (await isOwner()) {
    const { exam, create } = await searchParams;
    const initialExamId = typeof exam === "string" ? exam : undefined;
    const autoCreate = create === "1";
    return (
      <ExamsContent
        batchId={batchId}
        initialExamId={initialExamId}
        autoCreate={autoCreate}
      />
    );
  }

  return <StudentExams batchId={batchId} />;
}
