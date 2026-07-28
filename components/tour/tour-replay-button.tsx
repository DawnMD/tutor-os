"use client";

import { useAuth } from "@clerk/nextjs";
import { HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTourForRoute } from "@/lib/tours/registry";
import { useTour } from "@/lib/tours/use-tour";
import { OrganizationRole } from "@/orpc/orpc";

/**
 * Header affordance for replaying the current page's tour. Renders nothing on
 * routes that don't have one for the viewer's role.
 */
export function TourReplayButton() {
  const pathname = usePathname();
  const { orgRole, isLoaded } = useAuth();
  const isOwner = orgRole === OrganizationRole.OWNER;

  // Before Clerk hydrates, an owner reads as a student — wait rather than
  // offering the wrong role's tour.
  const tour = isLoaded ? getTourForRoute(pathname, isOwner) : null;
  const { startTour } = useTour(tour?.id ?? null);

  if (!tour) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={startTour}
            aria-label="Take a tour of this page"
          >
            <HelpCircle />
          </Button>
        }
      />
      <TooltipContent>Take a tour of this page</TooltipContent>
    </Tooltip>
  );
}
