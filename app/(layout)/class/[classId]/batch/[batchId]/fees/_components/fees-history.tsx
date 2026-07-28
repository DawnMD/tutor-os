"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPaise } from "@/lib/currency";
import { periodLabel } from "./utils";
import type { BatchPayment } from "./utils";
import { METHOD_META } from "./utils";
import { format } from "date-fns";

export function FeesHistory({ payments }: { payments: BatchPayment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment history</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-(--card-spacing)">Student</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="pr-(--card-spacing)">Paid on</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-(--card-spacing) font-medium">
                    {p.student.fullName || p.student.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {periodLabel({ year: p.periodYear, month: p.periodMonth })}
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
            No payments recorded yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
