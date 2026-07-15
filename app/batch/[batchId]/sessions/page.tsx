import { auth } from "@clerk/nextjs/server";

export default async function BatchSessionspage({
  params,
}: PageProps<"/batch/[batchId]/sessions">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
