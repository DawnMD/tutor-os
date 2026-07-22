"use client";

import { DataTable } from "@/components/data-table/data-table";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { columns } from "./columns";

export const StudentTable = () => {
  const { data: joinedStudents, isLoading } = useQuery(
    orpc.owner.student.getAllStudents.queryOptions(),
  );

  return (
    <DataTable data={joinedStudents} columns={columns} loading={isLoading} />
  );
};
