import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { AttendanceMockup } from "./mockups/attendance-mockup";
import { FeesMockup } from "./mockups/fees-mockup";
import { StudentMockup } from "./mockups/student-mockup";
import { EyebrowLabel, Section } from "./section";

const OWNER_POINTS = [
  "One dashboard for classes, batches and students",
  "Attendance and session logs that build a history",
  "Fees computed monthly and collected over UPI",
  "Exams and marks in the same place",
];

const STUDENT_POINTS = [
  "A read-only view scoped to just their data",
  "Their attendance percentage and next exam",
  "Fee dues with one-tap UPI payment",
  "Invited by email — no messy sign-up",
];

function PointList({ points }: { points: string[] }) {
  return (
    <ul className="space-y-3">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
          </span>
          <span className="text-muted-foreground">{point}</span>
        </li>
      ))}
    </ul>
  );
}

export function RoleShowcase() {
  return (
    <Section id="roles">
      <div className="max-w-2xl">
        <EyebrowLabel>Two views, one system</EyebrowLabel>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Owners run it. Students see it.
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Owners */}
        <Card className="flex flex-col gap-6">
          <CardContent className="space-y-6">
            <div>
              <EyebrowLabel>For owners</EyebrowLabel>
              <h3 className="mt-3 font-heading text-xl font-semibold tracking-wide uppercase">
                The full control room
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Everything you need to run the institute, from the morning
                roster to the month-end fee sheet.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-muted/40 p-3 ring-1 ring-foreground/5">
                <AttendanceMockup />
              </div>
              <div className="bg-muted/40 p-3 ring-1 ring-foreground/5">
                <FeesMockup />
              </div>
            </div>
            <PointList points={OWNER_POINTS} />
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="flex flex-col gap-6">
          <CardContent className="space-y-6">
            <div>
              <EyebrowLabel>For students</EyebrowLabel>
              <h3 className="mt-3 font-heading text-xl font-semibold tracking-wide uppercase">
                Their own pocket view
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A clean, read-only view of what matters to them — attendance,
                exams and fees — on any phone.
              </p>
            </div>
            <div className="bg-muted/40 p-4 ring-1 ring-foreground/5">
              <StudentMockup />
            </div>
            <PointList points={STUDENT_POINTS} />
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
