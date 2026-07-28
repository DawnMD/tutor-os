"use client";

import { StudentArchivedState } from "@/components/student/student-archived-state";
import { StudentGate } from "@/components/student/student-gate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { env } from "@/env";
import { getArchivedScope } from "@/lib/archived-error";
import { formatPaise } from "@/lib/currency";
import { periodKey } from "@/lib/fee-periods";
import {
  loadRazorpayCheckout,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay-checkout";
import { orpc } from "@/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { METHOD_META, periodLabel } from "./utils";

export function StudentFees({ batchId }: { batchId: string }) {
  return (
    <StudentGate>
      <StudentFeesBody batchId={batchId} />
    </StudentGate>
  );
}

function StudentFeesBody({ batchId }: { batchId: string }) {
  const queryClient = useQueryClient();
  const [payingKey, setPayingKey] = useState<string | null>(null);

  const {
    data: allDues,
    isLoading: duesLoading,
    isError,
    error,
  } = useQuery({
    ...orpc.student.fees.myDues.queryOptions(),
    retry: false,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery(
    orpc.student.fees.myPayments.queryOptions(),
  );

  const createOrder = useMutation(
    orpc.student.fees.createOrder.mutationOptions(),
  );
  const verifyPayment = useMutation(
    orpc.student.fees.verifyPayment.mutationOptions(),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: orpc.student.fees.myDues.key(),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.student.fees.myPayments.key(),
    });
  };

  if (duesLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    const scope = getArchivedScope(error);
    if (scope === "batch" || scope === "class") {
      return <StudentArchivedState scope={scope} />;
    }
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText />
          </EmptyMedia>
          <EmptyTitle>Fees not available</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t load your fees right now. Please try again later.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const batchDues = allDues?.find((d) => d.batchId === batchId) ?? null;
  const dues = batchDues?.dues ?? [];
  const batchPayments = (payments ?? []).filter((p) => p.batch.id === batchId);

  async function pay(due: { year: number; month: number; amountPaise: number }) {
    const key = periodKey(due);
    setPayingKey(key);
    try {
      const Razorpay = await loadRazorpayCheckout();
      const order = await createOrder.mutateAsync({
        batchId,
        year: due.year,
        month: due.month,
      });

      const rzp = new Razorpay({
        key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: "INR",
        name: batchDues?.className ?? "Tuition fee",
        description: `${batchDues?.batchName ?? "Batch"} — ${periodLabel(due)}`,
        handler: (response: RazorpaySuccessResponse) => {
          verifyPayment.mutate(
            {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
            {
              onSuccess: () => {
                toast.success("Payment received");
                invalidate();
              },
              onError: () => {
                // The webhook may still confirm it — refetch and reassure.
                toast("Your payment is being confirmed.");
                invalidate();
              },
            },
          );
        },
        modal: {
          // Refresh in case the payment went through but the tab was closed.
          ondismiss: () => invalidate(),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't start the payment.",
      );
    } finally {
      setPayingKey(null);
    }
  }

  const totalDuePaise = dues.reduce((sum, d) => sum + d.amountPaise, 0);
  const nothingToShow = dues.length === 0 && batchPayments.length === 0;

  if (nothingToShow) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText />
          </EmptyMedia>
          <EmptyTitle>No fees for this batch</EmptyTitle>
          <EmptyDescription>
            There are no fees to pay for this batch right now. Anything you owe
            will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <Card data-tour="fees-dues">
        <CardHeader>
          <CardTitle className="text-base">
            {dues.length > 0
              ? `Outstanding dues — ${formatPaise(totalDuePaise)}`
              : "You're all caught up"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dues.length > 0 ? (
            <ul className="divide-y">
              {dues.map((due, index) => {
                const key = periodKey(due);
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{periodLabel(due)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatPaise(due.amountPaise)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      // The first due anchors the tour step about paying.
                      data-tour={index === 0 ? "fees-pay" : undefined}
                      onClick={() => pay(due)}
                      disabled={payingKey != null}
                    >
                      {payingKey === key ? "Starting..." : "Pay now"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have no outstanding dues for this batch.
            </p>
          )}
        </CardContent>
      </Card>

      <Card data-tour="fees-payments">
        <CardHeader>
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {batchPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-(--card-spacing)">Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="pr-(--card-spacing)">Paid on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-(--card-spacing) font-medium">
                      {periodLabel({
                        year: p.periodYear,
                        month: p.periodMonth,
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatPaise(p.amountPaise)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {METHOD_META[p.method].label}
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-muted-foreground tabular-nums">
                      {p.paidAt ? format(new Date(p.paidAt), "d MMM yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No payments yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
