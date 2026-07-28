# Tutor OS

A multi-tenant management platform for tuition & coaching centers. Tutor OS lets an
institute run its day-to-day operations — organizing classes and batches, tracking
attendance, recording sessions, and grading exams — while giving enrolled students a
role-scoped view of their own progress.

> A personal project built to explore full-stack, type-safe application architecture with a
> modern React/Next.js stack. Not affiliated with any commercial product.

## Overview

The platform is organized around a simple hierarchy — **Classes → Batches → Students** —
and layers scheduling, attendance, sessions, and exams on top. Every request is scoped to a
tenant (a coaching institute) via Clerk Organizations, and the entire experience branches on
the caller's role:

- **Owners / admins** manage classes, batches, enrollment, attendance, sessions, exams, notes,
  and fees, and get dashboards summarizing KPIs, attendance trends, upcoming exams, and
  students who need attention.
- **Students** see a read-only, privacy-scoped view of *their own* batches, attendance,
  exam results, notes, fee dues, and calendar — sharing the same pages, branched by role,
  and can pay fees online.

## Features

- **Multi-tenancy & RBAC** — Each institute is an isolated Clerk Organization; access is
  gated by organization role (`org:admin` owner vs. `org:member` student) at both the page
  and RPC layers.
- **Class / batch / student management** — Full CRUD with soft-archiving that preserves
  historical relations.
- **Attendance tracking** — Per-session attendance (present / absent / late / excused) with
  history, summaries, and trend charts.
- **Sessions** — Log class sessions with topics and summaries, and track completion over time.
- **Exams & grading** — Create exams, grade per-student results, and surface latest scores
  and progress.
- **Fees & payments** — Per-batch monthly fees priced in paise, with dues computed on the
  fly (never materialized) so owner and student views agree on exactly which months a
  student owes. Owners set fees, record manual payments, and review a payment history with
  KPI cards; students pay online via [Razorpay](https://razorpay.com) (UPI/cards, INR),
  with a signature-verified webhook as the source of truth for payment status.
- **Notes** — Attach batch notes with file attachments (via [UploadThing](https://uploadthing.com)),
  visible to enrolled students.
- **Dashboards** — Role-specific dashboards with KPI cards, attendance trends, upcoming
  exams, recent activity, and pending invitations.
- **Student invitations** — Invite students into an organization and manage pending
  invitations.
- **Calendar** — Schedule-driven calendar view of batch sessions and exams.
- **Light / dark theme** and a responsive, component-driven UI.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19, React Compiler) |
| Language | TypeScript |
| API | [oRPC](https://orpc.unnoq.com) — end-to-end type-safe RPC, with [TanStack Query](https://tanstack.com/query) |
| Auth & tenancy | [Clerk](https://clerk.com) (Organizations + role-based access) |
| Database | [Prisma 7](https://www.prisma.io) ORM over PostgreSQL ([Neon](https://neon.tech) serverless) |
| UI | [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), Base UI, [Recharts](https://recharts.org), [lucide-react](https://lucide.dev) |
| Forms & validation | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Payments | [Razorpay](https://razorpay.com) (INR, UPI/cards) with signature-verified webhooks |
| File uploads | [UploadThing](https://uploadthing.com) |

### Highlights

- **End-to-end type safety** from the database (Prisma) through the API (oRPC) to the React
  components — no hand-written API types or fetch clients.
- **Role-branched routing** — owner and student experiences reuse the same routes and
  components, branching on organization role, with the RPC layer as the real security
  boundary.
- **Server-first architecture** using React Server Components, server-only guards, and
  query prefetching.

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)
- A [Clerk](https://clerk.com) application with Organizations enabled
- An [UploadThing](https://uploadthing.com) app (for note attachments)
- A [Razorpay](https://razorpay.com) account (for online fee payments)

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env` file with your database, Clerk, UploadThing, and Razorpay credentials
   (see `env.ts` for the full, validated list of expected variables):

   ```env
   DATABASE_URL="postgresql://..."
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."
   CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
   UPLOADTHING_TOKEN="..."
   RAZORPAY_KEY_ID="rzp_..."
   RAZORPAY_KEY_SECRET="..."
   RAZORPAY_WEBHOOK_SECRET="..."
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_..."
   ```

3. Push the Prisma schema to your database and generate the client:

   ```bash
   pnpm db:push
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint with ESLint |
| `pnpm db:push` | Push the Prisma schema to the database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:migrate` | Apply migrations (deploy) |

## Project Structure

```
app/        Next.js App Router routes (owner + student views), grouped by feature
orpc/       oRPC routers (owner/*, student/*), context, and typed client setup
prisma/     Prisma schema and generated client
lib/        Server-only helpers (auth roles, guards, utilities)
components/  Shared UI components
hooks/      Reusable React hooks
```

## Status

An actively evolving personal project. Core owner and student flows are in place; ongoing
work is tracked in `todo.mdx`.
