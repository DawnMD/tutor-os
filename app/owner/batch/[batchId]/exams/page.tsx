import { auth } from "@clerk/nextjs/server";

export default async function BatchExamspage({
  params,
}: PageProps<"/owner/batch/[batchId]/exams">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
