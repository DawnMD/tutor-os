import { OwnerStudentsData } from "@/components/owner-students-data";
import { auth } from "@clerk/nextjs/server";

export default async function StudentsPage() {
  await auth.protect();

  return <OwnerStudentsData />;
}
