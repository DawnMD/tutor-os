import { auth } from "@clerk/nextjs/server";

export default async function BatchStudentDetaikPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students/[studentId]">) {
  await auth.protect();

  const { batchId, classId, studentId } = await params;

  return (
    <div>
      <p>{batchId}</p>
      <p>{classId}</p>
      <p>{studentId}</p>
    </div>
  );
}
