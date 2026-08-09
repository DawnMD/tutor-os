import { env } from "@/env";

/**
 * The app's own origin, used for Better Auth's `baseURL`/`trustedOrigins` and
 * for every link we put in an email.
 *
 * The production branch matters: `VERCEL_URL` is the *per-deployment* hostname
 * (`tutor-os-a1b2c3-….vercel.app`), which is immutable, changes on every
 * deploy, and is unreachable once Deployment Protection is on. Links mailed to
 * students have to point at the stable project domain instead, which is what
 * `VERCEL_PROJECT_PRODUCTION_URL` is — and it follows a custom domain
 * automatically if one is ever added.
 *
 * Preview deployments are the opposite case: the per-deployment URL is the only
 * one that resolves, and it's also the origin the session cookie is signed
 * against, so previews must *not* set `BETTER_AUTH_URL`.
 */
export const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;

  // Explicit override wins: a custom domain, or a tunnel for local testing.
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;

  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
};
