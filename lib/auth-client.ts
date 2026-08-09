import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * No `baseURL`: the client is always same-origin, so it works unchanged on
 * production, on every preview deployment, and on localhost — and there's no
 * NEXT_PUBLIC_* URL to keep in sync with the deployment it's running on.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
  organization,
} = authClient;
