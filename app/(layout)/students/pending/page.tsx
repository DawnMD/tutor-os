import { auth } from "@clerk/nextjs/server";
import { PendingInvitationsTable } from "./_components/pending-invitations-table";

export default async function PendingStudentsPage() {
  await auth.protect();

  return <PendingInvitationsTable />;
}
