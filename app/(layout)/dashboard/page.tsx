import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/roles";
import { DashboardContent } from "./_components/dashboard-content";
import { StudentDashboard } from "./_components/student-dashboard";

export default async function Page() {
  await auth.protect();

  if (await isOwner()) return <DashboardContent />;

  return <StudentDashboard />;
}
