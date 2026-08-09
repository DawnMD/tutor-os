import type { Metadata } from "next";
import { requireOrganization } from "@/lib/roles";
import BatchOverviewContent from "./_components/batch-overview-content";
import { StudentBatchOverview } from "./_components/student-batch-overview";

export const metadata: Metadata = {
  title: "Batch overview",
};

export default async function BatchOverviewpage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/overview">) {
  const { isOwner } = await requireOrganization();
  const { batchId } = await params;

  if (isOwner) return <BatchOverviewContent batchId={batchId} />;

  return <StudentBatchOverview batchId={batchId} />;
}
