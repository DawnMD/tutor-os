import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/roles";
import BatchOverviewContent from "./_components/batch-overview-content";
import { StudentBatchOverview } from "./_components/student-batch-overview";

export default async function BatchOverviewpage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/overview">) {
  await auth.protect();
  const { batchId } = await params;

  if (await isOwner()) return <BatchOverviewContent batchId={batchId} />;

  return <StudentBatchOverview batchId={batchId} />;
}
