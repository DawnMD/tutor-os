import { auth } from "@clerk/nextjs/server";
import BatchOverviewContent from "./_components/batch-overview-content";

export default async function BatchOverviewpage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/overview">) {
  await auth.protect();
  const { batchId } = await params;

  return <BatchOverviewContent batchId={batchId} />;
}
