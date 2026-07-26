import { auth } from "@clerk/nextjs/server";
import { StudentTable } from "../_components/student-table";

export default async function JoinedStudentsPage() {
  await auth.protect();

  return <StudentTable />;
}
