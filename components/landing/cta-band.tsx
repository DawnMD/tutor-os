import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Section } from "./section";

export function CtaBand() {
  return (
    <Section>
      <div className="relative overflow-hidden bg-card px-6 py-16 text-center ring-1 ring-foreground/5 sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-40 bg-primary/15 blur-3xl"
        />
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Ready to retire the paper register?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-muted-foreground">
          Set up your institute today and run attendance, exams and UPI fee
          collection from one calm dashboard.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ variant: "default", size: "lg" }), "group")}
          >
            Start free
            <ArrowRight className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
          </Link>
        </div>
        <p className="mt-4 text-xs tracking-wide text-muted-foreground">
          No credit card required.
        </p>
      </div>
    </Section>
  );
}
