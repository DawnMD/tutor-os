import { auth } from "@clerk/nextjs/server";
import ExamsContent from "./_components/exams-content";

export default async function BatchExamsPage({
  params,
  searchParams,
}: PageProps<"/class/[classId]/batch/[batchId]/exams">) {
  await auth.protect();
  const { batchId } = await params;
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
