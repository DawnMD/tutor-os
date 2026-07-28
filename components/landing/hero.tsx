import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DashboardMockup } from "./mockups/dashboard-mockup";
import { MockupFrame } from "./mockups/mockup-frame";
import { EyebrowLabel } from "./section";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
            <EyebrowLabel>Built for Indian tuition &amp; coaching institutes</EyebrowLabel>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl animate-in fade-in slide-in-from-bottom-4 delay-100 duration-700 fill-mode-both motion-reduce:animate-none">
            Run your coaching institute. Not a pile of spreadsheets.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700 fill-mode-both motion-reduce:animate-none">
            TutorOS puts classes, batches, attendance, exams and UPI fee
            collection in one calm dashboard — with a read-only view for every
            student.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700 fill-mode-both motion-reduce:animate-none">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "group w-full sm:w-auto")}
            >
              Start free
              <ArrowRight className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-xs tracking-wide text-muted-foreground animate-in fade-in delay-500 duration-700 fill-mode-both motion-reduce:animate-none">
            UPI payments via Razorpay · Works on any device · Light &amp; dark mode
          </p>
        </div>

        {/* Hero visual */}
        <div className="relative mt-16 animate-in fade-in slide-in-from-bottom-8 delay-500 duration-1000 fill-mode-both motion-reduce:animate-none">
          <div
            aria-hidden
            className="absolute inset-x-8 top-8 -z-10 h-full bg-primary/15 blur-3xl"
          />
          <MockupFrame className="mx-auto max-w-4xl">
            <DashboardMockup />
          </MockupFrame>
        </div>
      </div>
    </section>
  );
}
