"use client";

import { AddNewStudentPopup } from "@/components/add-new-student-popup";
import { DataTable } from "@/components/data-table/data-table";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { pendingColumns } from "./pending-columns";

export const PendingInvitationsTable = () => {
  const { data, isLoading } = useQuery(
    orpc.owner.student.getPendingInvitations.queryOptions(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddNewStudentPopup />
      </div>
      <div data-tour="pending-table">
        <DataTable data={data} columns={pendingColumns} loading={isLoading} />
      </div>
    </div>
  );
};
