"use client";
import { DataTable } from "@/components/data-table/data-table";
import { getArchivedScope } from "@/lib/archived-error";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { BatchArchivedState } from "../../_components/batch-archived-state";
import { columns } from "./columns";

export const BatchStudentsTable = ({ batchId }: { batchId: string }) => {
  const {
    data: joinedStudents,
    isLoading,
    error,
  } = useQuery(
    orpc.owner.batchStudent.getStudentsByBatch.queryOptions({
      input: {
        batchId,
      },
    }),
  );

  const archivedScope = getArchivedScope(error);
  if (archivedScope === "batch" || archivedScope === "class") {
    return <BatchArchivedState scope={archivedScope} />;
  }

  return (
    <DataTable data={joinedStudents} columns={columns} loading={isLoading} />
  );
};
