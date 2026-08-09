import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarCheck, IndianRupee, NotebookPen, Users } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign up",
};

const highlights = [
  {
    icon: Users,
    title: "Classes and batches, organised",
    body: "Group students the way your institute already works, and move them between batches without losing their history.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance in a few taps",
    body: "Mark a session's attendance from your phone between classes, with holidays and reschedules already accounted for.",
  },
  {
    icon: IndianRupee,
    title: "Fees that chase themselves",
    body: "Monthly dues are computed per batch, and students pay by UPI without you sending a single reminder.",
  },
  {
    icon: NotebookPen,
    title: "Notes and results in one place",
    body: "Share study material and publish exam results where your students already look for them.",
  },
];

export default function SignUpPage() {
  return (
    <div className="bg-muted grid min-h-svh flex-1 lg:grid-cols-2">
      <div className="hidden flex-1 items-center justify-end p-6 md:p-10 lg:flex">
        <ul className="max-w-sm space-y-8">
          {highlights.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <div className="flex items-center gap-2">
                <Icon className="size-4" />
                <p className="font-semibold">{title}</p>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">{body}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 md:p-10 lg:justify-start">
        <AuthCard
          title="Create your account"
          description="Set up your institute's workspace in a couple of minutes."
          footer={
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="underline underline-offset-4">
                Sign in
              </Link>
            </>
          }
        >
          {/* useSearchParams needs a suspense boundary during prerender. */}
          <Suspense fallback={<Skeleton className="h-72" />}>
            <SignUpForm />
          </Suspense>
        </AuthCard>
      </div>
    </div>
  );
}
