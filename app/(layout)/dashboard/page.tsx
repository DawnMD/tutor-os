import type { Metadata } from "next";
import { requireOrganization } from "@/lib/roles";
import { DashboardContent } from "./_components/dashboard-content";
import { StudentDashboard } from "./_components/student-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Page() {
  const { isOwner } = await requireOrganization();

  if (isOwner) return <DashboardContent />;

  return <StudentDashboard />;
}
