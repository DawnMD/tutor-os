import { auth } from "@clerk/nextjs/server";
import { DashboardContent } from "./_components/dashboard-content";

export default async function Page() {
  await auth.protect();

  return <DashboardContent />;
}
