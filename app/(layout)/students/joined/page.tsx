import { auth } from "@clerk/nextjs/server";
import { StudentTable } from "../_components/student-table";
import { requireOwnerPage } from "@/lib/roles";

export default async function JoinedStudentsPage() {
  await auth.protect();
  await requireOwnerPage();

  return <StudentTable />;
}
