import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReactNode } from "react";

/** Shared shell for the signed-out pages, matching the old Clerk card. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {children}
        {footer && (
          <div className="text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Full-bleed centered wrapper used by every signed-out route. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted flex min-h-svh w-full flex-1 items-center justify-center p-6 md:p-10">
      {children}
    </div>
  );
}
