import { auth } from "@clerk/nextjs/server";
import { CalendarView } from "./_components/calendar-view";

export default async function Page() {
  await auth.protect();

  return <CalendarView />;
}
