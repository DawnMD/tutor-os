import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard, AuthShell } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <AuthShell>
      <AuthCard
        title="Welcome back"
        description="Sign in to your TutorOS workspace."
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline underline-offset-4">
              Sign up
            </Link>
          </>
        }
      >
        {/* useSearchParams needs a suspense boundary during prerender. */}
        <Suspense fallback={<Skeleton className="h-56" />}>
          <SignInForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
