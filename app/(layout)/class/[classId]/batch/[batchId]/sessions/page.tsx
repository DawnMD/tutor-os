import { auth } from "@clerk/nextjs/server";
import SessionsContent from "./_components/sessions-content";
import { requireOwnerPage } from "@/lib/roles";

export default async function BatchSessionsPage({
  params,
  searchParams,
}: PageProps<"/class/[classId]/batch/[batchId]/sessions">) {
  await auth.protect();
  await requireOwnerPage();
  const { classId, batchId } = await params;
  const { session } = await searchParams;
  const initialSessionId = typeof session === "string" ? session : undefined;

  return (
    <SessionsContent
      classId={classId}
      batchId={batchId}
      initialSessionId={initialSessionId}
    />
  );
}
