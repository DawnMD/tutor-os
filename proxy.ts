import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic sign-in redirect.
 *
 * This is **not** a security boundary: `getSessionCookie` only checks that a
 * session cookie is present, never that it's valid. A forged cookie sails past
 * here and is rejected by the page guards (`lib/roles.ts`) and the oRPC role
 * middleware, which are the real boundary. Kept database-free on purpose.
 *
 * The matcher is an allowlist rather than the catch-all Clerk used. An
 * unconditional redirect over every path would swallow `/api/auth/*` — Better
 * Auth's own endpoints — and loop the sign-in request back onto itself. `/rpc`
 * is excluded too: oRPC clients expect an `UNAUTHORIZED` JSON error, and a 302
 * to an HTML page parses as a malformed response.
 */
export default function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/class/:path*",
    "/students/:path*",
    "/calendar/:path*",
    "/select-organization",
  ],
};
