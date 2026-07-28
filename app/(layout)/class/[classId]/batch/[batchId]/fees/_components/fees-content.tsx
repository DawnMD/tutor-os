"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getArchivedScope } from "@/lib/archived-error";
import { currentPeriod, type FeePeriod } from "@/lib/fee-periods";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { BatchArchivedState } from "../../_components/batch-archived-state";
import { FeeRosterTable } from "./fee-roster-table";
import { FeesHeader } from "./fees-header";
import { FeesHistory } from "./fees-history";
import { FeesKpiCards } from "./fees-kpi-cards";
import { FeesSkeleton } from "./fees-skeleton";
import { SetFeeDialog } from "./set-fee-dialog";
import { buildRoster, computeKpis, shiftPeriod } from "./utils";

export default function FeesContent({ batchId }: { batchId: string }) {
  const [period, setPeriod] = useState<FeePeriod>(() => currentPeriod());
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);

  const {
    data: batch,
    isLoading,
    error,
  } = useQuery(
    orpc.owner.fees.getBatchFeesPage.queryOptions({
      input: { batchId, year: period.year, month: period.month },
    }),
  );

  const { data: payments } = useQuery(
    orpc.owner.fees.listBatchPayments.queryOptions({ input: { batchId } }),
  );

  const derived = useMemo(() => {
    if (!batch || batch.monthlyFeePaise == null) return null;
    const roster = buildRoster(batch, period);
    return { roster, kpis: computeKpis(roster, batch.monthlyFeePaise) };
  }, [batch, period]);

  if (isLoading) {
    return <FeesSkeleton />;
  }

  const archivedScope = getArchivedScope(error);
  if (archivedScope === "batch" || archivedScope === "class") {
    return <BatchArchivedState scope={archivedScope} />;
  }

  if (!batch) {
    return (
      <Card className="border-dashed py-0">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>Batch not found</EmptyTitle>
            <EmptyDescription>
              This batch may have been archived or you don&apos;t have access to
              it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  const feeSet = batch.monthlyFeePaise != null;

  return (
    <div className="space-y-6">
      <FeesHeader
        batch={batch}
        period={period}
        onPrev={() => setPeriod((p) => shiftPeriod(p, -1))}
        onNext={() => setPeriod((p) => shiftPeriod(p, 1))}
        onEditFee={() => setFeeDialogOpen(true)}
      />

      {feeSet && derived ? (
        <>
          <FeesKpiCards kpis={derived.kpis} />
          <FeeRosterTable
            roster={derived.roster}
            batchId={batchId}
            period={period}
          />
          <FeesHistory payments={payments ?? []} />
        </>
      ) : (
        <Card className="border-dashed py-0">
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>No monthly fee set</EmptyTitle>
              <EmptyDescription>
                Set a monthly fee for this batch to start tracking dues and
                collecting payments from enrolled students.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setFeeDialogOpen(true)}>
                Set monthly fee
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      )}

      <SetFeeDialog
        // Remount so defaults reflect the latest fee when reopened.
        key={`${batch.monthlyFeePaise ?? "none"}-${feeDialogOpen}`}
        open={feeDialogOpen}
        onOpenChange={setFeeDialogOpen}
        batchId={batchId}
        currentFeePaise={batch.monthlyFeePaise}
      />
    </div>
  );
}
