import { ORPCError } from "@orpc/client";

type ArchivedScope = "batch" | "class" | "student";

/**
 * Detect the archived-resource conflict thrown by the owner routers. oRPC
 * reconstructs real `ORPCError` instances client-side (see the `Symbol.hasInstance`
 * workaround in `@orpc/client`), so `code`/`data` survive the round-trip.
 *
 * Returns the archived `scope` for UI branching, or `null` for any other error
 * (including a plain `NOT_FOUND`, which stays "doesn't exist / not yours").
 */
export function getArchivedScope(error: unknown): ArchivedScope | null {
  if (
    error instanceof ORPCError &&
    error.code === "CONFLICT" &&
    isArchivedData(error.data)
  ) {
    return error.data.scope;
  }

  return null;
}

function isArchivedData(
  data: unknown,
): data is { reason: "ARCHIVED"; scope: ArchivedScope } {
  return (
    typeof data === "object" &&
    data !== null &&
    "reason" in data &&
    (data as { reason?: unknown }).reason === "ARCHIVED" &&
    "scope" in data
  );
}
