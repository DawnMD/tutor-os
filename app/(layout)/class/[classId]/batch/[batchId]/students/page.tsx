import { auth } from "@clerk/nextjs/server";

export default async function BatchStudentspage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students">) {
  await auth.protect();
  const { batchId } = await params;

  return <div>{batchId}</div>;
}
