"use client";

import { useTour } from "@/lib/tours/use-tour";

/**
 * Renders nothing; auto-starts the given tour on the user's first visit to the
 * page. Mount it inside the branch where the tour's anchors actually render
 * (the loaded state, not the skeleton) — it's a client leaf, so server pages
 * can mount it directly.
 */
export function PageTour({ tourId }: { tourId: string }) {
  useTour(tourId, { autoStart: true });
  return null;
}
