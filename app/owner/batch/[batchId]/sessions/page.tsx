import { OwnerSessionCalendar } from "@/components/owner-session-calendar";
import { auth } from "@clerk/nextjs/server";

export default async function BatchSessionspage({
  params,
}: PageProps<"/owner/batch/[batchId]/sessions">) {
  await auth.protect();
  const { batchId } = await params;

  return <OwnerSessionCalendar batchId={batchId} />;
}
