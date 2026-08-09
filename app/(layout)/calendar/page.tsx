import type { Metadata } from "next";
import { requireOrganization } from "@/lib/roles";
import { CalendarView } from "./_components/calendar-view";
import { StudentCalendar } from "./_components/student-calendar";

export const metadata: Metadata = {
  title: "Calendar",
};

export default async function Page() {
  const { isOwner } = await requireOrganization();

  if (isOwner) return <CalendarView />;

  return <StudentCalendar />;
}
