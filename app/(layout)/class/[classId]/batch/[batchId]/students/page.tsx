import type { Metadata } from "next";
import { BatchStudentsTable } from "./_components/batch-student-table";
import { requireOwnerPage } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Batch students",
};

export default async function BatchStudentsPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/students">) {
  await requireOwnerPage();
  const { batchId } = await params;

  return <BatchStudentsTable batchId={batchId} />;
}
