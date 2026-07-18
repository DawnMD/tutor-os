import { auth } from "@clerk/nextjs/server";

export default async function BatchAttendancepage({
  params,
}: PageProps<"/owner/batch/[batchId]/attendance">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
