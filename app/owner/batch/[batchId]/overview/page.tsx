import { auth } from "@clerk/nextjs/server";

export default async function BatchOverviewpage({
  params,
}: PageProps<"/owner/batch/[batchId]/overview">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
