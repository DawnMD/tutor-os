import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma's generated client is checked in but not ours to lint.
    "prisma/generated/**",
  ]),
  [
    {
      rules: {
        // Tripwire for the Clerk migration. `next.config.ts` sets
        // `typescript.ignoreBuildErrors`, so a stray Clerk import would
        // otherwise build green and fail at runtime.
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@clerk/*"],
                message:
                  "Clerk has been replaced by Better Auth — use @/lib/auth (server) or @/lib/auth-client (client).",
              },
            ],
          },
        ],
      },
    },
  ],
]);

export default eslintConfig;
