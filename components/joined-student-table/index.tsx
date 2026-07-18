"use client";

import { columns } from "@/components/joined-student-table/columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";

export const JoinedStudentsTable = () => {
  const { data: joinedStudents } = useQuery(
    orpc.owner.student.getActiveStudentsByOrg.queryOptions(),
  );

  if (!joinedStudents) {
    return null;
  }

  return <DataTable data={joinedStudents} columns={columns} />;
};
