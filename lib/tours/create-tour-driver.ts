import { driver, type Driver, type DriveStep } from "driver.js";

import type { TourDefinition } from "./types";

export function tourSelector(target: string) {
  return `[data-tour="${target}"]`;
}

/**
 * An anchor counts only when it is actually laid out. `getClientRects()` is
 * empty for `display:none` subtrees (a collapsed sidebar section, a sidebar
 * that only exists inside the mobile Sheet), which is exactly what we want to
 * drop.
 */
export function findTourAnchor(target: string): Element | null {
  const el = document.querySelector(tourSelector(target));
  if (!el) return null;
  return el.getClientRects().length > 0 ? el : null;
}

/** Only one tour may run at a time across the whole app. */
let activeDriver: Driver | null = null;

/**
 * Builds a driver for the steps that can actually be shown right now.
 *
 * driver.js renders a step whose element is missing as an orphan floating
 * popover, so empty states and not-yet-loaded data have to be filtered out up
 * front rather than left to the library. Returns `null` when too few steps
 * survive to be worth interrupting the user for — callers must not mark the
 * tour as seen in that case.
 */
export function buildTourDriver(
  tour: TourDefinition,
  { minSteps = 2 }: { minSteps?: number } = {},
): Driver | null {
  if (typeof document === "undefined") return null;

  const steps: DriveStep[] = tour.steps
    .filter((step) => !step.target || findTourAnchor(step.target) !== null)
    .map((step) => ({
      element: step.target ? tourSelector(step.target) : undefined,
      popover: { title: step.title, description: step.description },
    }));

  if (steps.length < minSteps) return null;

  return driver({
    steps,
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    popoverClass: "tutoros-tour",
    // The spotlight is a walkthrough, not a sandbox — keep clicks on the
    // highlighted element from navigating away mid-tour.
    disableActiveInteraction: true,
    smoothScroll: true,
    stagePadding: 6,
    // Square corners, to match the rest of the app.
    stageRadius: 0,
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
  });
}

/** Starts `d`, tearing down any tour already running. */
export function startTourDriver(d: Driver) {
  if (activeDriver && activeDriver !== d) destroyTourDriver(activeDriver);
  activeDriver = d;
  d.drive();
}

export function destroyTourDriver(d: Driver | null) {
  if (!d) return;
  if (activeDriver === d) activeDriver = null;
  if (d.isActive()) d.destroy();
}
