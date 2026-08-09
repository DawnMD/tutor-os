import type { Metadata } from "next";
import { PendingInvitationsTable } from "./_components/pending-invitations-table";
import { PageTour } from "@/components/tour/page-tour";
import { requireOwnerPage } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Pending students",
};

export default async function PendingStudentsPage() {
  await requireOwnerPage();

  return (
    <>
      <PageTour tourId="owner-students-pending" />
      <PendingInvitationsTable />
    </>
  );
}
