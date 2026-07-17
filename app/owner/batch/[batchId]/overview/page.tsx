import { auth } from "@clerk/nextjs/server";

export default async function BatchOverviewpage({
  params,
}: PageProps<"/batch/[batchId]/overview">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
