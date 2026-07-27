import { auth } from "@clerk/nextjs/server";
import { PendingInvitationsTable } from "./_components/pending-invitations-table";
import { requireOwnerPage } from "@/lib/roles";

export default async function PendingStudentsPage() {
  await auth.protect();
  await requireOwnerPage();

  return <PendingInvitationsTable />;
}
