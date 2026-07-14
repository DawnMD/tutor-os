import { createEnv } from "@t3-oss/env-nextjs";
import { neonVercel, vercel } from "@t3-oss/env-nextjs/presets-zod";
import * as z from "zod";

export const env = createEnv({
  server: { NODE_ENV: z.enum(["development", "test", "production"]) },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  extends: [vercel(), neonVercel()],
});
