import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/roles";
import { CalendarView } from "./_components/calendar-view";
import { StudentCalendar } from "./_components/student-calendar";

export default async function Page() {
  await auth.protect();

  if (await isOwner()) return <CalendarView />;

  return <StudentCalendar />;
}
