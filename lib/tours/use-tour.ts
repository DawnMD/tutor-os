"use client";

import { useUser } from "@clerk/nextjs";
import type { Driver } from "driver.js";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  buildTourDriver,
  destroyTourDriver,
  findTourAnchor,
  startTourDriver,
} from "./create-tour-driver";
import { getTourById } from "./registry";
import {
  hasSeenTour,
  isAutostartLocked,
  lockAutostart,
  markTourSeen,
} from "./storage";

const POLL_INTERVAL_MS = 250;
/** How long to keep waiting for the *remaining* anchors once some are up. */
const SOFT_TIMEOUT_MS = 2_000;
/** How long to wait for the very first anchor before giving up entirely. */
const HARD_TIMEOUT_MS = 5_000;
/** One frame plus a beat, so cards finish laying out before we measure them. */
const SETTLE_MS = 300;

/**
 * Drives one tour. Pass `autoStart` to run it on the user's first visit to the
 * page; otherwise the hook only hands back `startTour` for manual replay.
 */
export function useTour(
  tourId: string | null,
  { autoStart = false }: { autoStart?: boolean } = {},
) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const userId = user?.id ?? null;

  // Registry entries are module-level constants, so this reference is stable.
  const tour = tourId ? getTourById(tourId) : null;
  const driverRef = useRef<Driver | null>(null);

  const startTour = useCallback(() => {
    if (!tour) return;
    // A replay is explicitly asked for, so run it even if only one anchor is
    // on screen, and mark it seen so it won't also auto-start later.
    const d = buildTourDriver(tour, { minSteps: 1 });
    if (!d) return;
    driverRef.current = d;
    startTourDriver(d);
    markTourSeen(tour, userId);
  }, [tour, userId]);

  useEffect(() => {
    // Wait for Clerk: before `isLoaded` the user id is unknown, and the
    // seen-state key is namespaced by it.
    if (!autoStart || !tour || !isLoaded) return;
    if (hasSeenTour(tour, userId) || isAutostartLocked()) return;

    let cancelled = false;
    let pollTimer: number | undefined;
    let settleTimer: number | undefined;
    let frame: number | undefined;

    const begin = () => {
      frame = window.requestAnimationFrame(() => {
        settleTimer = window.setTimeout(() => {
          if (cancelled) return;
          // Another page's tour may have claimed the session while we waited.
          if (isAutostartLocked()) return;

          const d = buildTourDriver(tour);
          // Too little on screen to be worth interrupting for — leave the tour
          // unseen so it gets another chance on a fuller visit.
          if (!d) return;

          driverRef.current = d;
          lockAutostart();
          startTourDriver(d);
          markTourSeen(tour, userId);
        }, SETTLE_MS);
      });
    };

    // Page data arrives via TanStack Query, so anchors are usually absent on
    // first paint — and a page can mix static anchors with query-backed ones.
    // Wait for all of them, but only briefly once some are up: an anchor an
    // empty state will never render must not hold the whole tour hostage.
    const targets = tour.steps
      .map((step) => step.target)
      .filter((target): target is string => Boolean(target));

    if (targets.length === 0) {
      begin();
    } else {
      const startedAt = Date.now();
      const poll = () => {
        if (cancelled) return;

        const found = targets.filter((t) => findTourAnchor(t)).length;
        const waited = Date.now() - startedAt;

        if (found === targets.length) return begin();
        if (found > 0 && waited >= SOFT_TIMEOUT_MS) return begin();
        // Nothing at all showed up — this page isn't going to render the tour.
        if (waited >= HARD_TIMEOUT_MS) return;

        pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
      };
      poll();
    }

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      // The highlighted elements go away with the route — tear the tour down.
      destroyTourDriver(driverRef.current);
      driverRef.current = null;
    };
  }, [autoStart, tour, isLoaded, userId, pathname]);

  return { startTour, tour };
}
