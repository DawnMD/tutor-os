import type { TourDefinition } from "./types";

/**
 * Seen-state lives entirely in the browser — no DB column, no Clerk metadata.
 * Keys are namespaced two ways:
 *   - by tour `version`, so editing a tour re-shows it;
 *   - by Clerk user id, so a shared device doesn't suppress another user's
 *     tours (and signing in as a different role starts fresh).
 */
function seenKey(tour: TourDefinition, userId: string | null) {
  return `tour:${tour.id}:v${tour.version}:${userId ?? "anon"}`;
}

/** Only one tour auto-starts per browser session; replay always works. */
const AUTOSTART_LOCK_KEY = "tour:autostart-lock";

export function hasSeenTour(tour: TourDefinition, userId: string | null) {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(seenKey(tour, userId)) !== null;
  } catch {
    // Private mode / storage disabled: treat as seen so we never nag.
    return true;
  }
}

export function markTourSeen(tour: TourDefinition, userId: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(seenKey(tour, userId), new Date().toISOString());
  } catch {
    // Nothing to do — the tour just runs again next time.
  }
}

/**
 * True once any tour has auto-started in this tab. Keeps a burst of navigation
 * right after sign-up from firing four tours in a row; the unseen ones surface
 * in the next session or from the header replay button.
 */
export function isAutostartLocked() {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(AUTOSTART_LOCK_KEY) !== null;
  } catch {
    return true;
  }
}

export function lockAutostart() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTOSTART_LOCK_KEY, "1");
  } catch {
    // Best effort; worst case another tour auto-starts this session.
  }
}
