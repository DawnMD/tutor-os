"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Outputs } from "@/orpc/router";
import { Mail } from "lucide-react";
import Link from "next/link";

type Invitation = Outputs["owner"]["student"]["getPendingInvitations"][number];

export function PendingInvitationsCard({
  invitations,
  isLoading,
}: {
  invitations: Invitation[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Pending invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : !invitations || invitations.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No pending invitations.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-2xl font-bold">{invitations.length}</span>{" "}
              <span className="text-muted-foreground">
                {invitations.length === 1 ? "invite" : "invites"} awaiting
                sign-up
              </span>
            </p>
            <ul className="space-y-1">
              {invitations.slice(0, 3).map((inv) => (
                <li
                  key={inv.id}
                  className="truncate text-xs text-muted-foreground"
                >
                  {inv.emailAddress}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {invitations && invitations.length > 0 && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/students/pending" />}
          >
            Manage invitations
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
