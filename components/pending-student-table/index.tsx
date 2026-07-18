"use client";

import { columns } from "@/components/pending-student-table/columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";

export const PendingStudentsTable = () => {
  const { data: pendingStudents } = useQuery(
    orpc.owner.student.getPendingStudentsByOrg.queryOptions(),
  );

  if (!pendingStudents) {
    return null;
  }

  return <DataTable data={pendingStudents} columns={columns} />;
};
