import { auth } from "@clerk/nextjs/server";
import { BatchStudentsTable } from "./_components/batch-student-table";
import { requireOwnerPage } from "@/lib/roles";

export default async function BatchStudentsPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students">) {
  await auth.protect();
  await requireOwnerPage();
  const { batchId } = await params;

  return <BatchStudentsTable batchId={batchId} />;
}
