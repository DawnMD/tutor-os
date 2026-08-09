"use client";

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
export function TourReplayButton({ orgRole }: { orgRole: string | null }) {
  const pathname = usePathname();
  const isOwner = orgRole === OrganizationRole.OWNER;

  const tour = getTourForRoute(pathname, isOwner);
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
