import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard, AuthShell } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthCard
        title="Choose a new password"
        description="Pick something you haven't used here before."
      >
        {/* useSearchParams needs a suspense boundary during prerender. */}
        <Suspense fallback={<Skeleton className="h-56" />}>
          <ResetPasswordForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
