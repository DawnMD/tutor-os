import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { PendingInvitationsTable } from "./_components/pending-invitations-table";
import { PageTour } from "@/components/tour/page-tour";
import { requireOwnerPage } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Pending students",
};

export default async function PendingStudentsPage() {
  await auth.protect();
  await requireOwnerPage();

  return (
    <>
      <PageTour tourId="owner-students-pending" />
      <PendingInvitationsTable />
    </>
  );
}
