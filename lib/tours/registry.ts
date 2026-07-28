import type { TourDefinition } from "./types";

const BATCH_OVERVIEW = /^\/class\/[^/]+\/batch\/[^/]+\/overview$/;
const BATCH_FEES = /^\/class\/[^/]+\/batch\/[^/]+\/fees$/;

/**
 * Every tour in the app. Steps target `data-tour` attributes; any step whose
 * anchor is missing at run time is dropped (see `buildTourDriver`), so a tour
 * degrades gracefully on empty states instead of pointing at nothing.
 */
export const TOURS: TourDefinition[] = [
  {
    id: "owner-dashboard",
    version: 1,
    role: "owner",
    match: (p) => p === "/dashboard",
    steps: [
      {
        title: "Welcome to TutorOS",
        description:
          "This is your control center. Here's a quick lap around the parts you'll use most — it takes about 30 seconds.",
      },
      {
        target: "nav-class",
        title: "Classes and batches",
        description:
          "A class holds batches, and a batch holds students. Everything you run day to day — sessions, attendance, exams, fees and notes — lives inside a batch.",
      },
      {
        target: "nav-students",
        title: "Your students",
        description:
          "Invite students by email. They sit under Pending until they sign up, then move to Joined and can be added to batches.",
      },
      {
        target: "dashboard-kpis",
        title: "The numbers that matter",
        description:
          "Active students and batches, sessions completed this week, and your attendance rate over the last 30 days.",
      },
      {
        target: "dashboard-today",
        title: "Today's schedule",
        description:
          "Every class happening today, including rescheduled and extra ones. Use the arrow on a row to jump straight to marking attendance.",
      },
      {
        target: "dashboard-invites",
        title: "Pending invitations",
        description:
          "Students you've invited who haven't signed up yet. Manage or resend them from here.",
      },
    ],
  },
  {
    id: "owner-classes",
    version: 1,
    role: "owner",
    match: (p) => p === "/class",
    steps: [
      {
        title: "Classes",
        description:
          "A class is the subject or course you teach — each one holds the batches your students are enrolled in.",
      },
      {
        target: "add-class",
        title: "Create a class",
        description:
          "Name it and add an optional description. You can add batches to it right after, from the sidebar.",
      },
      {
        target: "class-cards",
        title: "Your classes",
        description:
          "Each card shows its batch and student counts. Open a batch from the buttons at the bottom, or archive a class you no longer run.",
      },
      {
        target: "nav-class",
        title: "Jump anywhere",
        description:
          "The sidebar mirrors this: expand a class, then a batch, to reach its sessions, attendance, exams, students, fees and notes.",
      },
    ],
  },
  {
    id: "owner-batch-overview",
    version: 1,
    role: "owner",
    match: (p) => BATCH_OVERVIEW.test(p),
    steps: [
      {
        target: "batch-header",
        title: "This batch",
        description:
          "Name, class and status at a glance. Add a student to the batch here, or edit and archive it from the menu.",
      },
      {
        target: "batch-kpis",
        title: "Batch health",
        description:
          "Headcount, attendance rate across recorded sessions, the next scheduled class, and the upcoming exam.",
      },
      {
        target: "batch-quick-actions",
        title: "Quick actions",
        description:
          "The four things you do most: start today's session, mark attendance, create an exam, or invite a student.",
      },
      {
        target: "nav-class",
        title: "The rest of the batch",
        description:
          "Sessions, attendance, exams, students, fees and notes for this batch are all one click away in the sidebar.",
      },
    ],
  },
  {
    id: "owner-students-pending",
    version: 1,
    role: "owner",
    match: (p) => p === "/students/pending",
    steps: [
      {
        target: "invite-student",
        title: "Invite a student",
        description:
          "Send an invite to their email address. They'll get a link to join your organization.",
      },
      {
        target: "pending-table",
        title: "Who hasn't joined yet",
        description:
          "Everyone invited but not yet signed up. Manage each invitation from the actions menu on its row.",
      },
      {
        target: "nav-students",
        title: "Pending and joined",
        description:
          "Once a student accepts, they move to Joined — that's where you add them to a batch.",
      },
    ],
  },
  {
    id: "owner-batch-fees",
    version: 1,
    role: "owner",
    match: (p) => BATCH_FEES.test(p),
    steps: [
      {
        target: "fees-set-fee",
        title: "Start with the monthly fee",
        description:
          "Set one monthly amount for the batch. Every student's dues are computed from it, so nothing else on this page works until it's set.",
      },
      {
        target: "fees-header",
        title: "One month at a time",
        description:
          "Fees are tracked per month. Use the arrows to look back at earlier months — you can't skip ahead of the current one.",
      },
      {
        target: "fees-kpis",
        title: "Collection at a glance",
        description:
          "Expected versus collected for the selected month, and how much is still pending.",
      },
      {
        target: "fees-roster",
        title: "Student roster",
        description:
          "Every enrolled student's status for the month. Record a cash or UPI payment you took in person — or undo one — from the row actions.",
      },
      {
        target: "fees-history",
        title: "Payment history",
        description:
          "Every payment recorded for this batch, including the ones students pay online themselves.",
      },
    ],
  },
  {
    id: "student-dashboard",
    version: 1,
    role: "student",
    match: (p) => p === "/dashboard",
    steps: [
      {
        title: "Welcome to TutorOS",
        description:
          "Your classes, attendance, exam results and fees all live here. Here's a quick tour.",
      },
      {
        target: "nav-my-batches",
        title: "My batches",
        description:
          "Every batch you're enrolled in. Expand one to reach its attendance, exam results, fees and notes.",
      },
      {
        target: "student-kpis",
        title: "Your numbers",
        description:
          "Your attendance rate, how many batches you're in, exams coming up, and your most recent result.",
      },
      {
        target: "student-next-class",
        title: "What's next",
        description:
          "Your next class and everything scheduled for today, including rescheduled and extra classes.",
      },
      {
        target: "student-exams",
        title: "Upcoming exams",
        description:
          "Exams your tutor has scheduled across all your batches, soonest first.",
      },
    ],
  },
  {
    id: "student-batch-overview",
    version: 1,
    role: "student",
    match: (p) => BATCH_OVERVIEW.test(p),
    steps: [
      {
        target: "student-batch-summary",
        title: "This batch at a glance",
        description:
          "Recent sessions with the attendance your tutor marked for you, alongside the batch's weekly schedule.",
      },
      {
        target: "nav-my-batches",
        title: "More for this batch",
        description:
          "Your full attendance record, exam results, fees and notes are in the sidebar under this batch.",
      },
    ],
  },
  {
    id: "student-fees",
    version: 1,
    role: "student",
    match: (p) => BATCH_FEES.test(p),
    steps: [
      {
        target: "fees-dues",
        title: "What you owe",
        description:
          "Any months still unpaid for this batch, with the total at the top.",
      },
      {
        target: "fees-pay",
        title: "Pay online",
        description:
          "Pay securely by UPI, card or netbanking. Your status updates as soon as the payment is confirmed.",
      },
      {
        target: "fees-payments",
        title: "Your receipts",
        description:
          "Every payment for this batch, including fees your tutor recorded after you paid in person.",
      },
    ],
  },
];

export function getTourById(tourId: string) {
  return TOURS.find((tour) => tour.id === tourId) ?? null;
}

/** The tour for a route, picked for the viewer's role (routes are shared). */
export function getTourForRoute(pathname: string, isOwner: boolean) {
  const role = isOwner ? "owner" : "student";
  return TOURS.find((tour) => tour.role === role && tour.match(pathname)) ?? null;
}
