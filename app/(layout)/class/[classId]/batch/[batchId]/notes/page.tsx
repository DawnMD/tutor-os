import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/roles";
import BatchNotesContent from "./_components/batch-notes-content";
import { StudentBatchNotes } from "./_components/student-batch-notes";

export const metadata: Metadata = {
  title: "Notes",
};

export default async function BatchNotesPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/notes">) {
  await auth.protect();
  const { batchId } = await params;

  if (await isOwner()) return <BatchNotesContent batchId={batchId} />;

  return <StudentBatchNotes batchId={batchId} />;
}
