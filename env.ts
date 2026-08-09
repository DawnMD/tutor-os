import { createEnv } from "@t3-oss/env-nextjs";
import { neonVercel, vercel } from "@t3-oss/env-nextjs/presets-zod";
import * as z from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    BETTER_AUTH_SECRET: z.string().min(32),
    // Optional: only set this where the origin is stable and known (production,
    // or a local tunnel). Leaving it unset on preview deployments is what lets
    // each preview resolve its own URL — see lib/get-base-url.ts.
    BETTER_AUTH_URL: z.url().optional(),
    RESEND_API_KEY: z.string().startsWith("re_"),
    // Not `z.email()` — Resend takes a full "Name <address>" sender.
    EMAIL_FROM: z.string().min(3),
    UPLOADTHING_TOKEN: z.string(),
    RAZORPAY_KEY_ID: z.string(),
    RAZORPAY_KEY_SECRET: z.string(),
    RAZORPAY_WEBHOOK_SECRET: z.string(),
  },
  client: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  extends: [vercel(), neonVercel()],
});
