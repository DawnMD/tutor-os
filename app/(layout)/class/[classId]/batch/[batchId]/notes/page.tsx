import type { Metadata } from "next";
import { requireOrganization } from "@/lib/roles";
import BatchNotesContent from "./_components/batch-notes-content";
import { StudentBatchNotes } from "./_components/student-batch-notes";

export const metadata: Metadata = {
  title: "Notes",
};

export default async function BatchNotesPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/notes">) {
  const { isOwner } = await requireOrganization();
  const { batchId } = await params;

  if (isOwner) return <BatchNotesContent batchId={batchId} />;

  return <StudentBatchNotes batchId={batchId} />;
}
