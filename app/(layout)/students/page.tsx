import { auth } from "@clerk/nextjs/server";
import { StudentTable } from "./_components/student-table";

export default async function StudentsPage() {
  await auth.protect();

  return <StudentTable />;
}
