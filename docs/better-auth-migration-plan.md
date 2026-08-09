# Clerk → Better Auth migration plan

Status: **proposal / not started**
Target branch: `claude/clerk-auth-migration-plan-3gb6je`
Scope: replace `@clerk/nextjs` + `@clerk/ui` with self-hosted [Better Auth](https://www.better-auth.com) (email/password + Google OAuth + the `organization` plugin), keeping every current product behaviour intact.

---

## 0. TL;DR

| | |
|---|---|
| Files touching Clerk today | **31** source files (+ 6 Prisma models with `clerk*` columns) |
| Hardest part | **Not** the session plumbing — it's the **UI we no longer get for free** (`<SignIn/>`, `<SignUp/>`, `<OrganizationList/>`) and **transactional email**, which Clerk currently owns end-to-end |
| Biggest win | The `Student` mirror table + `app/api/webhooks/clerk/route.ts` **disappear as a distributed-systems problem** — membership lives in our own Postgres, so the mirror becomes an in-transaction hook with no webhook lag and no `StudentGate` polling |
| Recommended ID strategy | **Preserve Clerk IDs as Better Auth primary keys.** Zero rewrites of `clerkOrganizationId` / `clerkUserId` across 6 tables and ~60 query sites; rename the columns later as a pure cosmetic follow-up |
| Recommended password strategy | **Do not import password hashes.** Force one-time re-credentialing (reset-password email or Google OAuth) at cutover — see §7.3 |
| Sequencing | 9 phases, ~7 PRs, additive DB changes first, destructive renames only after a soak period |
| Rollback | Trivial until Phase 8 (schema is purely additive; revert the deploy). Expensive after |

---

## 1. Current-state inventory

### 1.1 Packages

```
@clerk/nextjs        ^7.6.1     runtime (server + client)
@clerk/ui            ^1.26.0    shadcn theme for prebuilt components
@clerk/eslint-plugin ^0.2.0     dev — require-auth-protection rule
```

### 1.2 Every file that touches Clerk

**Auth core (5)**

| File | What it does |
|---|---|
| `proxy.ts` | Next 16 proxy running `clerkMiddleware()` |
| `orpc/context.ts` | `auth()` → `{ userId, orgId, orgRole, sessionId }` + `clerkClient()` into RPC context |
| `orpc/orpc.ts` | `OrganizationRole = { OWNER: "org:admin", STUDENT: "org:member" }`; `protectedProcedure` → `organizationProcedure` → `roleProcedure` |
| `lib/roles.ts` | `getOrgRole()`, `isOwner()`, `requireOwnerPage()` for server pages |
| `env.ts` | 5 Clerk env vars |

**Server pages calling `auth()` / `auth.protect()` (13)**

`app/page.tsx`, `app/(layout)/layout.tsx`, `app/(layout)/dashboard/page.tsx`, `app/(layout)/calendar/page.tsx`, `app/(layout)/class/page.tsx`, `app/(layout)/students/layout.tsx`, `.../students/joined/page.tsx`, `.../students/pending/page.tsx`, and the six `class/[classId]/batch/[batchId]/{overview,sessions,attendance,exams,fees,notes,students}` pages (+ `students/[studentId]`).

**Prebuilt-UI pages (4)** — these have no Better Auth equivalent and must be **rewritten from scratch**

`app/sign-in/[[...sign-in]]/page.tsx` (`<SignIn/>`), `app/sign-up/[[...sign-up]]/page.tsx` (`<SignUp/>`), `app/select-organization/[[...select-organization]]/page.tsx` (`<OrganizationList/>`), `app/accept-invitation/[[...accept-invitation]]/page.tsx` (`<SignIn/>`).

**Client components (6)**

| File | Clerk API |
|---|---|
| `components/providers.tsx` + `components/clerk-provider.tsx` | `<ClerkProvider appearance={{theme: shadcn}}>` |
| `components/nav-user.tsx` | `useUser()`, `<SignOutButton>` |
| `components/team-switcher.tsx` | `useOrganization()`, `useOrganizationList({userMemberships:{infinite:true}})`, `setActive()`, `createOrganization()` |
| `components/app-breadcrumb.tsx` | `useAuth()` → `orgRole`, `isLoaded` |
| `components/tour/tour-replay-button.tsx` | `useAuth()` → `orgRole`, `isLoaded` |
| `lib/tours/use-tour.ts` | `useUser()` → `user.id` for the localStorage seen-key namespace |

**Backend-API consumers (2)**

| File | Clerk API |
|---|---|
| `orpc/router/owner/student.ts` | `createOrganizationInvitation`, `getOrganizationInvitationList`, `revokeOrganizationInvitation`, `getOrganizationInvitation` |
| `app/api/uploadthing/core.ts` | `auth()` in the UploadThing middleware |

**Webhook (1)** — `app/api/webhooks/clerk/route.ts`: mirrors `organizationMembership.{created,updated,deleted}` into the `Student` table via `verifyWebhook()`.

**Tooling (1)** — `eslint.config.mjs`: `@clerk/next/require-auth-protection` with a `public:` allowlist.

### 1.3 Clerk identifiers in the database

| Model | Columns | Constraints that depend on them |
|---|---|---|
| `Class` | `clerkOrganizationId` | `@@unique([clerkOrganizationId, name])`, 2 indexes |
| `Student` | `clerkOrganizationId`, `clerkUserId` | `@@unique([clerkOrganizationId, clerkUserId])`, 4 indexes |
| `Batch` | `clerkOrganizationId` | 1 index |
| `Holiday` | `clerkOrganizationId` | `@@unique([clerkOrganizationId, date])`, 1 index |
| `BatchNote` | `clerkOrganizationId`, `uploadedByClerkUserId` | 1 index |
| `FeePayment` | `clerkOrganizationId` | 1 index |

Plus one **out-of-band** carrier: `orpc/router/student/fees.ts:185` writes `clerkOrganizationId` into Razorpay order `notes`. The webhook's `parseNotes()` doesn't read that key today, so it's inert — but in-flight orders at cutover will carry the old key name, which matters for §8.

### 1.4 Behavioural contracts we must preserve

1. **Two roles, org-scoped.** `org:admin` = tutor/owner, `org:member` = student. Role is per-organization, and switching orgs can change your role (`team-switcher.tsx` re-lands on `/dashboard` and calls `router.refresh()` precisely because of this).
2. **Every page assumes an active org.** `app/(layout)/layout.tsx` redirects to `/select-organization` when `orgId` is null.
3. **Students are mirrored, not authoritative.** The `Student` row is created by webhook on membership-created; removal *archives* (never deletes) because `Student` cascades to `FeePayment`/`AttendanceRecord`/`ExamResult`.
4. **RPC is the real security boundary.** Page guards are UX only (documented in `lib/roles.ts`). This stays true after migration.
5. **Owners invite students by email**; pending invitations are listed, revoked, and resent from `/students/pending` and surfaced on the dashboard.

---

## 2. Target architecture

```
lib/auth.ts              betterAuth({ … })  — server instance, Prisma adapter, organization plugin
lib/auth-client.ts       createAuthClient({ plugins: [organizationClient(), …] })
app/api/auth/[...all]/route.ts   toNextJsHandler(auth)
```

### 2.1 Server instance (sketch)

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization, customSession } from "better-auth/plugins";
import { db } from "@/prisma/db";
import { env } from "@/env";
import { OrganizationRole } from "@/orpc/roles";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => sendMail(resetPasswordEmail(user, url)),
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => sendMail(verifyEmail(user, url)),
  },
  socialProviders: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  },

  session: {
    // Avoids a DB round-trip per request in createContext(); see §2.3 for the
    // staleness caveat on role changes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  databaseHooks: {
    session: {
      create: {
        // Preserves today's "always land in an org" behaviour: pick the user's
        // sole/most-recent membership so /select-organization is only shown to
        // genuinely multi-org (or zero-org) users.
        before: async (session) => ({
          data: { ...session, activeOrganizationId: await pickInitialOrg(session.userId) },
        }),
      },
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,   // tightened in §5.4
      invitationExpiresIn: 60 * 60 * 24 * 30, // match Clerk's 30d, not BA's 48h default
      sendInvitationEmail: async (data) => sendMail(inviteEmail(data)),
      organizationHooks: {
        afterAddMember:        mirrorStudent,   // replaces the Clerk webhook
        afterUpdateMemberRole: mirrorStudent,
        afterRemoveMember:     archiveStudent,
      },
    }),
    // Puts the active member's role on the session object so the oRPC context
    // stays a single call, exactly like Clerk's `orgRole`.
    customSession(async ({ user, session }) => {
      const role = session.activeOrganizationId
        ? await getMemberRole(session.userId, session.activeOrganizationId)
        : null;
      return { user, session: { ...session, activeOrganizationRole: role } };
    }),
    nextCookies(), // must be last
  ],
});
```

### 2.2 Role mapping

| Concept | Clerk | Better Auth | Notes |
|---|---|---|---|
| Tutor / owner | `org:admin` | `owner` | BA makes the org creator `owner` automatically |
| Student | `org:member` | `member` | |
| (unused) | — | `admin` | BA ships a third default role; we simply never assign it |

`OrganizationRole` in `orpc/orpc.ts` is already the single source of truth for these strings and is compared against everywhere (`lib/roles.ts`, `app-sidebar.tsx`, `app-breadcrumb.tsx`, `tour-replay-button.tsx`, `uploadthing/core.ts`, the Clerk webhook). **Changing the two literals there is most of the role migration.**

> Action: move `OrganizationRole` out of `orpc/orpc.ts` into `orpc/roles.ts` (or `lib/roles-shared.ts`) first. Today client components import it from a module that transitively pulls in `@orpc/server` and `@/env`; that works but is fragile, and `lib/auth.ts` will need it too.

### 2.3 How the request context changes

```ts
// orpc/context.ts — after
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/prisma/db";

export async function createContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  return {
    db,
    auth,                                   // replaces `clerk`
    userId: session?.user.id ?? null,
    organizationId: session?.session.activeOrganizationId ?? null,
    organizationRole: session?.session.activeOrganizationRole ?? null,
    sessionId: session?.session.id ?? null,
  };
}
```

**Everything downstream of `createContext` is unchanged.** `orpc/orpc.ts`'s `protectedProcedure` / `organizationProcedure` / `roleProcedure` chain, all 60+ `clerkOrganizationId: context.organizationId` query sites, and both `helpers.ts` guard modules keep working verbatim. That is the single most important property of this plan and the reason to preserve Clerk IDs (§4).

⚠️ **Cookie-cache staleness.** With `cookieCache` on, a role change (owner demotes a member, or a member is removed) isn't reflected until the cache expires. Two mitigations, both required:
- Call `auth.api.setActiveOrganization` / trigger a session refresh on the client after any org switch (`team-switcher.tsx` already does `queryClient.invalidateQueries()` + `router.refresh()` — extend it to refresh the session).
- Keep `maxAge` short (≤5 min) and accept the window, **or** disable `cookieCache` and eat one indexed lookup per request. Given this app's traffic profile, starting with `cookieCache: false` and enabling it later after measuring is the safer default.

### 2.4 `proxy.ts`

`clerkMiddleware()` exists only to make `auth()` work. Better Auth reads cookies/headers directly, so **no proxy is required for correctness**. Options:

- **A (recommended):** shrink `proxy.ts` to an optimistic unauthenticated-redirect using `getSessionCookie(request)` — cheap, no DB, and it only redirects; it never authorizes. Real enforcement stays in pages + RPC.
- **B:** delete `proxy.ts` entirely. Unauthenticated users then hit `auth.protect()`-equivalents in the pages, one render later.

Do **not** put authorization decisions in the proxy — Better Auth's docs are explicit that cookie presence is not authenticity.

---

## 3. Prisma schema changes

### 3.1 New Better Auth tables (additive, generated)

`npx @better-auth/cli generate` emits `User`, `Session`, `Account`, `Verification`, plus `Organization`, `Member`, `Invitation` from the organization plugin, and adds `activeOrganizationId` to `Session`.

Caveats for **this** repo:

1. **Prisma 7 + custom generator output.** `schema.prisma` uses `generator client { provider = "prisma-client", output = "./generated/prisma" }`. The BA CLI needs that path configured; verify the generated models land in the same file and that `pnpm postinstall` (`prisma generate`) still resolves.
2. **Naming collision.** The BA `User` model has no conflict, but be deliberate that our domain `Student` is *not* the auth user — it stays a per-org profile row keyed by `(organizationId, userId)`.
3. **`prisma.config.ts` uses `DATABASE_URL_UNPOOLED`** for migrations while runtime uses the pooled Neon adapter. The migration script in §7 must use the unpooled URL.
4. Review generated column types against the Neon adapter (BA uses `text` ids by default — good, since Clerk ids like `user_2abc…` are text).

### 3.2 Two-phase column rename (no big-bang)

**Phase A — rename in Prisma only, keep the SQL column names:**

```prisma
model Class {
  organizationId String @map("clerkOrganizationId")
  // …
  @@unique([organizationId, name], map: "Class_clerkOrganizationId_name_key")
  @@index([organizationId], map: "Class_clerkOrganizationId_idx")
}
```

This is a **zero-downtime, zero-SQL** change: `prisma migrate dev` produces an empty migration, application code gets clean names, and rollback is a redeploy. Do the same for `Student.userId @map("clerkUserId")` and `BatchNote.uploadedByUserId @map("uploadedByClerkUserId")`.

Touches ~60 call sites but every one is a mechanical rename; TypeScript catches all of them (note `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so **run `tsc --noEmit` manually** — the build will not fail for you).

**Phase B — actual `ALTER TABLE … RENAME COLUMN` + index/constraint renames.** Deferred to after the soak period (§9). Purely cosmetic; can be dropped from scope entirely without harm.

### 3.3 Optional relational tightening (defer)

Once ids are Better Auth ids, `Student.userId` → `User.id` and `Class.organizationId` → `Organization.id` could become real FKs. **Don't do this during the migration.** It changes cascade semantics on a schema whose archive-instead-of-delete behaviour is load-bearing (see the comment block in `app/api/webhooks/clerk/route.ts`). File it as a follow-up.

---

## 4. The ID decision (do this first — everything else depends on it)

### Option A — preserve Clerk IDs as Better Auth primary keys ✅ recommended

Insert migrated rows with explicit `id` values (`user_2abc…`, `org_2xyz…`) straight through Prisma in the migration script, bypassing BA's id generator.

- ✅ **Zero updates to 6 business tables** and ~60 query sites.
- ✅ Cutover is atomic: the moment the auth tables are populated, existing rows already join correctly.
- ✅ Rollback stays cheap.
- ⚠️ Cosmetically odd: `user_*` / `org_*` prefixes persist forever in the DB. Acceptable — they're opaque strings.
- ⚠️ New records created after cutover get BA-style ids, so the table holds mixed formats. Harmless; nothing parses these.

### Option B — new IDs + backfill

Generate fresh ids, keep `clerkUserId`/`clerkOrganizationId` as legacy mapping columns, then `UPDATE` every table.

- ❌ 6 tables, 3 unique constraints, 10 indexes rewritten under a write freeze.
- ❌ Every failure mode is a partial-update data-integrity bug in a schema holding **payment history**.
- ✅ Only advantage: cleaner ids.

**Decision: Option A.** The id format is not worth risking `FeePayment` integrity for.

---

## 5. Feature-parity matrix and what has to be built

| Capability | Clerk today | Better Auth | Work |
|---|---|---|---|
| Session on server | `auth()` | `auth.api.getSession({ headers })` | Mechanical, 13 pages + context + uploadthing |
| Route protection | `auth.protect()` | `getSession()` + `redirect("/sign-in")` | Write one `requireSession()` helper in `lib/roles.ts`, swap 13 call sites |
| Active org id | `orgId` | `session.activeOrganizationId` | Mechanical |
| Active org role | `orgRole` | `customSession` field or `getActiveMemberRole()` | §2.3 |
| Sign in UI | `<SignIn/>` | — **none** | **Build** |
| Sign up UI | `<SignUp/>` | — **none** | **Build** |
| Password reset / verify email | Clerk-hosted | — **none** | **Build** (pages + emails) |
| Org picker / creator | `<OrganizationList/>` | — **none** | **Build** |
| Org switcher | `useOrganizationList` + `setActive` | `authClient.organization.{list,setActive,create}` + `useListOrganizations`/`useActiveOrganization` | Rewrite `team-switcher.tsx` |
| Current user | `useUser()` | `authClient.useSession()` | `nav-user.tsx`, `use-tour.ts` |
| Sign out | `<SignOutButton>` | `authClient.signOut()` | `nav-user.tsx` |
| Invite by email | `createOrganizationInvitation` | `auth.api.createInvitation` + our own `sendInvitationEmail` | Rewrite `owner/student.ts` **+ new email infra** |
| List pending invites | `getOrganizationInvitationList({status:["pending"]})` | `auth.api.listInvitations` | Rewrite + field mapping (§5.2) |
| Revoke invite | `revokeOrganizationInvitation` | `auth.api.cancelInvitation` | Rewrite |
| Resend invite | revoke + create (already) | cancel + create | Same shape |
| Accept invite | Clerk-hosted redirect | `authClient.organization.acceptInvitation({ invitationId })` | **Build page + flow** (§5.3) |
| Membership → `Student` sync | Webhook + `svix` verify | In-process `organizationHooks` | **Delete the webhook route** — big win |
| Auth-protection lint rule | `@clerk/eslint-plugin` | — **none** | Regression (§5.5) |
| Transactional email | Clerk-hosted | — **none** | **New dependency** (§5.1) |
| MFA / bot protection / device mgmt | Clerk-hosted | plugins (`twoFactor`, `captcha`) | Out of scope unless currently relied on — **confirm with the Clerk dashboard config** |

### 5.1 Email — the real blocker

Clerk currently sends invitation, verification, and password-reset emails. Better Auth sends **nothing**; you supply the callbacks. This is net-new infrastructure:

- Pick a provider (Resend is the common pairing; SES/Postmark fine). New dep + `RESEND_API_KEY` + a verified sending domain with SPF/DKIM — **domain verification has lead time; start it on day 1 of the project, not at cutover.**
- Three templates minimum: *You've been invited to {org}*, *Verify your email*, *Reset your password*.
- Deliverability matters here: an invitation email that lands in spam is a student who can never join. Budget time for a real from-domain, not `onboarding@resend.dev`.
- Add a dev-mode transport that logs the URL to console so local development doesn't need a provider.

### 5.2 Invitation field mapping (breaks two client components)

`orpc/router/owner/student.ts::getPendingInvitations` currently returns a whitelisted shape. The names and types change:

| Today (Clerk) | After (Better Auth) |
|---|---|
| `emailAddress: string` | `email: string` |
| `createdAt: number` (unix ms) | `createdAt: Date` |
| `expiresAt: number` (unix ms) | `expiresAt: Date` |
| `status: "pending" \| …` | `status: "pending" \| "accepted" \| "rejected" \| "canceled"` |

Consumers: `app/(layout)/students/pending/_components/pending-columns.tsx` (`accessorKey: "emailAddress"`, `format(createdAt, "PPP")`), `pending-actions-menu.tsx`, and `app/(layout)/dashboard/_components/pending-invitations-card.tsx` (`inv.emailAddress`).

> **Recommendation:** keep the RPC output shape *identical* to today (map `email` → `emailAddress`, `Date` → `getTime()`) in the first PR so zero client components change, then rename in a follow-up. Decouples the risky change from the cosmetic one. Note `orpc/serializer.ts` already handles `Date` over the wire — check it before deciding.

Also: Better Auth's default `invitationExpiresIn` is **48 hours** vs Clerk's 30 days. Set it explicitly or you will silently degrade the invite flow.

### 5.3 Accept-invitation flow (new, and easy to get wrong)

Clerk handled the whole dance behind `redirectUrl` + `<SignIn/>`. The new flow:

1. Email links to `/accept-invitation/{invitationId}`.
2. Page loads the invitation server-side (`auth.api.getInvitation`) and renders org name + inviter.
3. **Not signed in** → sign-up/sign-in form prefilled and *locked* to the invitation's email, then auto-accept on return. Preserve the `invitationId` across the OAuth round-trip (callback URL param, not just local state).
4. **Signed in as a different email** → explicit "you're signed in as X, this invite is for Y" branch with a sign-out affordance. Clerk handled this; if you don't, users silently accept into the wrong account.
5. `authClient.organization.acceptInvitation({ invitationId })`, then `setActive`, then `/dashboard`.
6. Error states to design: expired, already-accepted, canceled, already-a-member.

The existing `app/accept-invitation/[[...accept-invitation]]/page.tsx` becomes `app/accept-invitation/[invitationId]/page.tsx`.

### 5.4 Org creation policy

`team-switcher.tsx` gates "Add workspace" on `canCreate` (owner-only). Better Auth's `allowUserToCreateOrganization` accepts a function — mirror the rule server-side, since the client gate is cosmetic. Also decide what a **brand-new signup with zero orgs** does: today Clerk's `<OrganizationList/>` offers "create". Keep that: `/select-organization` should offer create-org to any user with no memberships (that's how a new tutor onboards), and `allowUserToCreateOrganization` must permit it.

### 5.5 Lint-rule regression — name it, don't hide it

`eslint.config.mjs` enforces `@clerk/next/require-auth-protection` across `app/**` with a 4-entry public allowlist. **Better Auth has no equivalent.** Losing it means a future page can ship unguarded with nothing failing.

Mitigations (pick one, don't skip):
- A ~40-line local flat-config ESLint rule: any `app/**/page.tsx` default export must call `requireSession()`/`requireOwnerPage()`, with the same allowlist shape.
- Or a route-inventory test that walks `app/`, hits each route unauthenticated, and asserts a redirect.

The first is closer to what exists today and cheap.

### 5.6 Things to check in the Clerk dashboard before scoping

The code doesn't tell you whether these are on. Confirm each; any "yes" adds scope:

- Social/OAuth providers actually enabled (and which — the migration must recreate `Account` rows for them, matched by provider + provider account id).
- MFA / 2FA enforcement.
- Bot protection / allowlists / blocklists.
- Email OTP or magic-link sign-in.
- Session lifetime, multi-session, and "sign out of other devices" behaviour.
- Custom session-token claims (JWT templates) consumed anywhere.
- Organization domains / auto-join rules.

---

## 6. Phase plan

Each phase is a PR-sized unit. Phases 1–4 ship behind the existing Clerk app still running — **nothing user-visible changes until Phase 6.**

### Phase 0 — Decisions & prerequisites (no code)
- [ ] Confirm §5.6 dashboard inventory.
- [ ] Choose email provider; start domain verification.
- [ ] Confirm ID strategy = Option A.
- [ ] Confirm password strategy (§7.3).
- [ ] Get a Clerk Secret Key with read access for the export script; snapshot user/org/membership/invitation counts (they're the reconciliation target).
- [ ] Take a Neon branch/snapshot of production for rehearsal.

### Phase 1 — Foundations, dormant (no behaviour change)
- Add `better-auth` + email provider deps.
- `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`.
- Extend `env.ts`: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY` — **added alongside** the Clerk vars, which stay until Phase 8.
- `npx @better-auth/cli generate`, review the diff, `prisma migrate dev`. Verify `pnpm build` and the Neon adapter still work with the new models.
- Move `OrganizationRole` to `orpc/roles.ts`; update the ~7 importers.
- ✅ Exit: `/api/auth/*` responds, tables exist, app behaves exactly as before.

### Phase 2 — Prisma column rename via `@map` (§3.2 Phase A)
- Rename in schema only; mechanical rename of ~60 call sites; empty migration.
- **Run `tsc --noEmit` explicitly** (`ignoreBuildErrors: true` will not catch these).
- ✅ Exit: no SQL change, full test pass, app unchanged.

### Phase 3 — Auth UI (largest phase; parallelizable, still dormant)
Build against Better Auth while Clerk still owns the live routes, at temporary paths (`/auth/sign-in`, …) or behind a flag:
- Sign-in (email+password, Google, "forgot password" link).
- Sign-up (+ post-signup "verify your email" state).
- Forgot-password → reset-password (token from email).
- `/select-organization`: list memberships, set active, create org — replaces `<OrganizationList hidePersonal afterSelectOrganizationUrl="/">`.
- `/accept-invitation/[invitationId]` per §5.3.
- Email templates + dev console transport.
- Everything uses the existing shadcn kit + `react-hook-form` + `zod` already in the repo. `components/clerk-provider.tsx` is deleted; `components/providers.tsx` drops the wrapper (Better Auth needs no provider — the client is a module singleton).
- ✅ Exit: full signup → verify → create org → invite → accept → sign-in loop works end to end against a **staging** DB.

> Accelerator to consider: `@daveyplate/better-auth-ui` gives prebuilt shadcn-styled auth pages. Evaluate it in Phase 0 — it can remove most of Phase 3, at the cost of another dependency and less control over the invite flow.

### Phase 4 — Server + client wiring swap
- `orpc/context.ts` → `auth.api.getSession` (§2.3); drop `clerk` from context.
- `lib/roles.ts` → `requireSession()`, `getOrgRole()`, `isOwner()`, `requireOwnerPage()` on Better Auth.
- 13 pages: `auth.protect()` → `await requireSession()`; `const { orgId, orgRole } = await auth()` → session reads.
- `app/api/uploadthing/core.ts` middleware.
- Client: `nav-user.tsx`, `team-switcher.tsx`, `app-breadcrumb.tsx`, `tour-replay-button.tsx`, `lib/tours/use-tour.ts`.
  - ⚠️ `app-breadcrumb.tsx` and `tour-replay-button.tsx` both depend on Clerk's `isLoaded` to avoid firing a student-only query as an owner (there's an explicit comment about the FORBIDDEN it causes). `authClient.useSession()` exposes `isPending` — map it carefully or you resurrect that bug.
  - ⚠️ `team-switcher.tsx` uses `userMemberships: { infinite: true }`. `useListOrganizations()` is not paginated the same way; for this app's org counts a flat list is fine, but it's a real API-shape change.
- `orpc/router/owner/student.ts`: the 4 invitation procedures → `auth.api.*`, output shape preserved (§5.2).
- Replace the webhook with `organizationHooks` in `lib/auth.ts` — port the exact semantics from `app/api/webhooks/clerk/route.ts`: upsert on member add, **archive (never delete)** on remove, and handle the role-change-in-both-directions case.
- `proxy.ts` → optimistic `getSessionCookie` gate (§2.4).
- ✅ Exit: with Clerk env vars removed locally, the entire app works against staging.

### Phase 5 — Data migration script (§7)
- `scripts/migrate-clerk.ts`, idempotent, dry-run mode, reconciliation report.
- Rehearse ≥2× against a Neon branch of production. Compare counts and spot-check joins.

### Phase 6 — Cutover (§8)

### Phase 7 — Soak (1–2 weeks)
Clerk app stays live and env vars stay set; monitor sign-in success rate, invitation accepts, `Student` mirror consistency, and error logs.

### Phase 8 — Decommission
- Remove `@clerk/nextjs`, `@clerk/ui`, `@clerk/eslint-plugin`; drop the 5 Clerk env vars; delete `app/api/webhooks/clerk/`; remove the Clerk webhook endpoint in the dashboard; land the replacement lint rule (§5.5).

### Phase 9 — Cosmetic cleanup (optional, anytime after soak)
- §3.2 Phase B real column renames; drop `@map`s.
- Rename the invitation output fields and update the two client components.
- Rename the Razorpay note key (§8.4).
- Consider real FKs (§3.3) as a separate, carefully-reviewed change.

---

## 7. Data migration

### 7.1 What moves

| Clerk | → | Better Auth | Key |
|---|---|---|---|
| User | | `User` (+ `Account` per OAuth identity) | `id` preserved |
| Organization | | `Organization` (`slug` derived from name, uniqueness-checked) | `id` preserved |
| Organization membership | | `Member` (role remapped per §2.2) | new id |
| Pending organization invitation | | `Invitation` (status `pending`, `inviterId` = the Clerk inviter's user id) | new id |
| Email verification state | | `User.emailVerified` | |
| — | | `Session` | **Not migrated.** Everyone signs in again |

Source the export from the **Clerk Backend API** (`@clerk/backend`: `users.getUserList`, `organizations.getOrganizationList`, `.getOrganizationMembershipList`, `.getOrganizationInvitationList`) rather than the dashboard CSV — the CSV doesn't carry org/membership/invitation data at all, and you need those.

### 7.2 Script requirements

- **Idempotent**: `upsert` on preserved ids, so a re-run after a partial failure is safe.
- **`--dry-run`** printing the full plan and a per-table diff.
- **Reconciliation report**: Clerk counts vs inserted counts vs, critically, *existing `Student` rows whose `(organizationId, userId)` has no matching `Member`*. That set is the blast radius of a bad migration — every one is a student who can't sign in.
- Uses `DATABASE_URL_UNPOOLED` (matching `prisma.config.ts`).
- Batched (Clerk paginates at 500) with resumable cursors.
- Writes a JSON audit log of everything it created.

### 7.3 Passwords — recommended: don't migrate them

Clerk hashes with **bcrypt**; Better Auth defaults to **scrypt**. The official guide handles this by configuring BA to verify bcrypt for imported users — but it requires the password hashes, and Clerk does **not** include them in a self-serve dashboard export; you must request them, and holding a bcrypt dump raises its own handling obligations.

Given this app's user base (tutors + their students, small counts, invitation-driven):

**Recommended:** import users **without** credentials. At cutover:
- Users with a Google identity → `Account` row is migrated, sign-in Just Works.
- Password users → one-time "we've upgraded sign-in, set your password" email carrying a reset link; the reset flow (built in Phase 3) sets a Better Auth password. Pre-verify these users (`emailVerified: true`) so they don't have to re-verify too.

Trade-off: one extra step for password users at cutover, in exchange for never touching a hash dump. If that friction is unacceptable, the bcrypt-import path (`password: { verify }` configured for legacy hashes, transparently re-hashing to scrypt on first successful login) is viable — it just moves the project from "no secret material handled" to "secret material handled", which changes the review bar.

**Either way, communicate before cutover.** A silent forced re-credentialing during exam week is a support incident.

---

## 8. Cutover runbook

Pick a low-traffic window. Expect **all sessions to be invalidated** — this is unavoidable.

**T-7d**
1. Email all users: date, what changes, that they'll sign in again, and (if §7.3 recommended path) that password users get a set-password link.
2. Email domain verified and warmed; send a test invitation to a real inbox and confirm it isn't in spam.
3. Final rehearsal on a production DB branch; record the reconciliation report.

**T-0**
4. Put the app in maintenance / read-only (or accept a short 503 — writes during migration risk `Student` rows without `Member` rows).
5. Snapshot the DB (Neon branch).
6. Run `migrate-clerk.ts --dry-run`, eyeball, then run for real.
7. Verify the reconciliation report: **zero** orphan `Student` rows, member counts match, pending invitations match.
8. Deploy the Better Auth build with all env vars set.
9. Smoke test on production (§8.2).
10. Lift maintenance. Send the set-password mail-out.

**T+1h → T+7d**
11. Watch sign-in success rate, `/api/auth/*` error rate, invitation accept rate, and the `Student`↔`Member` consistency check (worth a scheduled job during the soak).
12. Keep the Clerk app **live and untouched** for the whole soak.

### 8.2 Production smoke test

- [ ] Sign in as an existing owner → lands on the correct org, sidebar shows owner nav.
- [ ] Sign in as an existing student → student dashboard, `StudentGate` resolves immediately (no polling state).
- [ ] Owner switches org → role flips correctly, breadcrumbs and nav re-render, no FORBIDDEN in the console.
- [ ] Owner invites a brand-new email → email arrives → accept → new `Student` row appears **immediately** (hook, not webhook) → student signs in.
- [ ] Owner revokes and resends an invitation.
- [ ] Owner uploads a batch note (UploadThing middleware path).
- [ ] Student initiates a Razorpay fee payment → webhook marks PAID.
- [ ] Sign out from `nav-user`.
- [ ] Unauthenticated hit on `/dashboard`, `/class`, `/students/joined` → redirect to sign-in.
- [ ] A student hitting an owner-only URL directly → `/dashboard`, and the corresponding RPC returns FORBIDDEN.
- [ ] Password reset round-trip.
- [ ] New tutor signup with zero orgs → create-org path.

### 8.3 Rollback

| Point | Rollback |
|---|---|
| Phases 1–5 | Revert the deploy. Schema is additive; the new tables are simply unused |
| Phase 6, within minutes | Redeploy the Clerk build (Clerk app still live, env vars still valid). Auth tables become inert; **any user created in Better Auth during the window exists only there** — reconcile manually |
| After Phase 8 | No fast rollback. This is why decommission waits for the soak |
| After Phase 9B | Requires a reverse column-rename migration. Cosmetic only — never block on it |

### 8.4 In-flight Razorpay orders

Orders created pre-cutover carry `notes.clerkOrganizationId`. `parseNotes()` in `app/api/webhooks/razorpay/route.ts` ignores that key entirely (it only reads `batchId`, `studentId`, `periodYear`, `periodMonth`), so a capture arriving after cutover still resolves. **Keep writing the key name unchanged through cutover**, and if you rename it in Phase 9, have the reader accept both for at least one payment cycle.

---

## 9. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Invitation emails land in spam → students can't join | High | High | Verified sending domain + SPF/DKIM, warm-up, real from-address, T-7d deliverability test |
| 2 | Auth UI is under-scoped (5 flows, ~10 states, all edge cases Clerk handled) | High | Med | Phase 3 is the single largest phase; consider `@daveyplate/better-auth-ui`; enumerate error states up front |
| 3 | `Student` rows orphaned from `Member` rows after migration | Med | **Critical** — student locked out of their own fees/attendance | Reconciliation report gates the cutover; consistency job during soak |
| 4 | Cookie-cache staleness leaves a demoted user with owner powers for ≤5 min | Med | High | Start with `cookieCache: false`; refresh session on org switch; **RPC role check is still the boundary** |
| 5 | `isLoaded`→`isPending` mismatch resurrects the "owner fires student query → FORBIDDEN" bug | Med | Low | Named explicitly in Phase 4; the existing code comments document the exact failure |
| 6 | Lost `require-auth-protection` lint rule → future unguarded page | Med | High | Replacement rule ships in Phase 8, not "later" |
| 7 | `typescript.ignoreBuildErrors: true` hides rename breakage until runtime | High | Med | `tsc --noEmit` in CI as part of Phase 2 |
| 8 | Undiscovered Clerk dashboard feature in use (MFA, JWT template, org domains) | Med | Med | §5.6 inventory in Phase 0 |
| 9 | Password re-credentialing seen as an outage | Med | Med | T-7d comms + immediate post-cutover mail-out |
| 10 | Better Auth version churn on a fast-moving library | Low | Med | Pin exact versions; read the changelog before any upgrade during the project |
| 11 | Prisma 7 custom generator output vs BA CLI | Med | Low | Shake out in Phase 1, before anything depends on it |

---

## 10. What gets simpler (worth stating)

- **`app/api/webhooks/clerk/route.ts` is deleted.** ~120 lines of careful idempotency/replay/archive-vs-delete reasoning collapses into an `afterAddMember` hook running in-process against the same database.
- **`StudentGate`'s webhook-lag polling becomes dead code.** The "Your account is being set up" state (`components/student/student-gate.tsx`, with `refetchInterval: 5000`) existed solely because the mirror was eventually consistent. Membership and `Student` now commit in the same request. Keep the branch as a cheap safety net, but it should never render.
- **One less external dependency in the request path**, and org/member data becomes joinable in SQL instead of requiring a Clerk API call (`getPendingInvitations` currently makes a network round-trip per dashboard load).
- **Local development stops needing Clerk keys**, and seeding a test org/user becomes a plain Prisma insert.

---

## 11. Effort estimate

| Phase | Est. |
|---|---|
| 0 — decisions, dashboard inventory, domain verification | 0.5d (+ waiting) |
| 1 — foundations, schema generate | 1d |
| 2 — `@map` rename + call sites | 0.5d |
| 3 — **auth UI + email** | **4–6d** (2–3d with a UI kit) |
| 4 — server/client wiring, invitations, hooks | 2–3d |
| 5 — migration script + 2 rehearsals | 1.5d |
| 6 — cutover | 0.5d |
| 7 — soak | passive, 1–2w |
| 8 — decommission + lint rule | 0.5d |
| 9 — cosmetic renames | 0.5d |
| **Total** | **~11–14 engineer-days** of build, plus a 1–2 week soak |

Phase 3 dominates and is the only phase that parallelizes cleanly across two people (auth pages vs. org/invite pages + emails).

---

## 12. Open questions for the owner

1. **Which sign-in methods do we commit to?** Email+password only, +Google, or magic-link/OTP? This changes Phase 3's size and the §7.3 password decision. (Magic link would let us skip passwords entirely — worth considering for students specifically.)
2. **Password import or forced reset?** §7.3 recommends forced reset; confirm the support cost is acceptable.
3. **Build the auth UI or adopt `@daveyplate/better-auth-ui`?** Roughly 2–3 days of difference.
4. **Is email verification required before joining an org?** Clerk's current setting decides whether invited students can act immediately.
5. **Do we ever want >2 roles?** If a "co-tutor / assistant" role is on the horizon, Better Auth's `createAccessControl` should be introduced in Phase 1 rather than retrofitted after `roleProcedure` hardens around two literals.
6. **Acceptable cutover window** — full read-only maintenance, or accept a small risk of writes during migration?

---

## References

- [Better Auth — Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth — Organization plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better Auth — Prisma adapter](https://www.better-auth.com/docs/adapters/prisma)
- [Better Auth — Clerk migration guide](https://www.better-auth.com/docs/guides/clerk-migration-guide)
- [Better Auth — Basic usage](https://www.better-auth.com/docs/basic-usage)
