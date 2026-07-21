import { auth } from "@clerk/nextjs/server";

export default async function BatchOverviewpage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/overview">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
