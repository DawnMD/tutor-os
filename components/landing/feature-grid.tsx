import {
  CalendarCheck,
  IndianRupee,
  Layers,
  NotebookPen,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { EyebrowLabel, Section } from "./section";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: CalendarCheck,
    title: "Attendance at a glance",
    description:
      "Mark present, late, absent or excused in seconds — and watch attendance trends build up over the term.",
  },
  {
    icon: IndianRupee,
    title: "Collect fees over UPI",
    description:
      "Monthly dues are computed per batch and collected over UPI through Razorpay, then confirmed by webhook.",
  },
  {
    icon: Layers,
    title: "Classes → batches → students",
    description:
      "Organise everything into classes and batches. Archive what you no longer run — you never have to delete.",
  },
  {
    icon: NotebookPen,
    title: "Exams & grading",
    description:
      "Schedule exams, record marks and give every student a clear picture of how they are doing.",
  },
  {
    icon: ScrollText,
    title: "A log of every session",
    description:
      "Each class you run is recorded, so you always have a dependable history of what happened and when.",
  },
  {
    icon: ShieldCheck,
    title: "Students see their own data",
    description:
      "Invite students by email for a read-only, privacy-scoped view — they only ever see what's theirs.",
  },
];

export function FeatureGrid() {
  return (
    <Section id="features">
      <div className="max-w-2xl">
        <EyebrowLabel>Everything in one place</EyebrowLabel>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          The operating system for your institute
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            size="sm"
            className="transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <span className="mb-2 flex size-9 items-center justify-center bg-primary/10 text-primary">
                <feature.icon className="size-4" />
              </span>
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
