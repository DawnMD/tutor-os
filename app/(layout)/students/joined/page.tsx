import type { Metadata } from "next";
import { StudentTable } from "../_components/student-table";
import { requireOwnerPage } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Students",
};

export default async function JoinedStudentsPage() {
  await requireOwnerPage();

  return <StudentTable />;
}
