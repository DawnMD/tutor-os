"use client";

import { DataTable } from "@/components/data-table/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { columns } from "./columns";

export const StudentTable = () => {
  const { data, isLoading } = useQuery(
    orpc.owner.student.getAllStudents.queryOptions(),
  );

  const [showArchived, setShowArchived] = useState(false);

  const students = useMemo(
    () => (showArchived ? data : data?.filter((s) => !s.archivedAt)),
    [data, showArchived],
  );

  return (
    <div className="flex flex-col gap-4">
      <Label className="ml-auto">
        <Checkbox
          checked={showArchived}
          onCheckedChange={(checked) => setShowArchived(checked === true)}
        />
        Show archived
      </Label>
      <div data-tour="joined-table">
        <DataTable data={students} columns={columns} loading={isLoading} />
      </div>
    </div>
  );
};
