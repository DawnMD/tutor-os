import { auth } from "@clerk/nextjs/server";

export default async function BatchStudentspage({
  params,
}: PageProps<"/batch/[batchId]/students">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
