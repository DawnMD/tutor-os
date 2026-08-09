import type { Metadata } from "next";
import { PageTour } from "@/components/tour/page-tour";
import { requireOrganization } from "@/lib/roles";
import FeesContent from "./_components/fees-content";
import { StudentFees } from "./_components/student-fees";

export const metadata: Metadata = {
  title: "Fees",
};

export default async function BatchFeesPage({
  params,
}: PageProps<"/class/[classId]/batch/[batchId]/fees">) {
  const { isOwner } = await requireOrganization();
  const { batchId } = await params;

  if (isOwner) {
    return (
      <>
        <PageTour tourId="owner-batch-fees" />
        <FeesContent batchId={batchId} />
      </>
    );
  }

  return (
    <>
      <PageTour tourId="student-fees" />
      <StudentFees batchId={batchId} />
    </>
  );
}
