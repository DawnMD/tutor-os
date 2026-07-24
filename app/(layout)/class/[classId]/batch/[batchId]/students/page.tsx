import { auth } from "@clerk/nextjs/server";
import { BatchStudentsTable } from "./_components/batch-student-table";

export default async function BatchStudentsPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students">) {
  await auth.protect();
  const { batchId } = await params;

  return <BatchStudentsTable batchId={batchId} />;
}
