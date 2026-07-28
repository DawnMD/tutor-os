"use client";

import { DataTable } from "@/components/data-table/data-table";
import type { FeePeriod } from "@/lib/fee-periods";
import { useMemo, useState } from "react";
import { getRosterColumns } from "./columns";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { UndoPaymentDialog } from "./undo-payment-dialog";
import type { RosterRow } from "./utils";

interface FeeRosterTableProps {
  roster: RosterRow[];
  batchId: string;
  period: FeePeriod;
}

export function FeeRosterTable({
  roster,
  batchId,
  period,
}: FeeRosterTableProps) {
  const [recordTarget, setRecordTarget] = useState<RosterRow | null>(null);
  const [undoTarget, setUndoTarget] = useState<RosterRow | null>(null);

  const columns = useMemo(
    () =>
      getRosterColumns({
        onRecord: setRecordTarget,
        onUndo: setUndoTarget,
      }),
    [],
  );

  return (
    <>
      <DataTable columns={columns} data={roster} loading={false} />

      <RecordPaymentDialog
        // Remount per target so the form resets to defaults.
        key={recordTarget?.studentId ?? "none"}
        open={recordTarget != null}
        onOpenChange={(open) => {
          if (!open) setRecordTarget(null);
        }}
        batchId={batchId}
        period={period}
        target={recordTarget}
      />

      <UndoPaymentDialog
        open={undoTarget != null}
        onOpenChange={(open) => {
          if (!open) setUndoTarget(null);
        }}
        batchId={batchId}
        target={undoTarget}
      />
    </>
  );
}
