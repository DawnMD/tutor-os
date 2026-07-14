import { createEnv } from "@t3-oss/env-nextjs";
import { vercel, neonVercel } from "@t3-oss/env-nextjs/presets-zod";
// import * as z from "zod";

export const env = createEnv({
  server: {},
  client: {},
  runtimeEnv: {},
  extends: [vercel(), neonVercel()],
});
