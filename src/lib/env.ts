import "server-only";

import { z } from "zod";

const postgresUrl = z
  .string()
  .min(1, "is required")
  .refine(
    (value) =>
      value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "must be a PostgreSQL connection string",
  );

/** Treat blank values in `.env` as absent so optional credentials stay optional. */
const optionalOAuthCredential = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    /**
     * Email/password sign-up. Closed everywhere by default until email
     * verification ships; OAuth sign-up is unaffected. Set to true only to
     * test email/password sign-up locally.
     */
    AUTH_EMAIL_SIGN_UP_ENABLED: z.stringbool().default(false),
    /** Neon branch, direct (non-pooler) endpoint — used by drizzle-kit. */
    DATABASE_URL: postgresUrl,
    /** Neon branch, pooled (PgBouncer) endpoint — used by the app at runtime. */
    DATABASE_URL_POOLED: postgresUrl,
    /**
     * Better Auth signing secret (32+ chars). Optional in development, where
     * Better Auth falls back to its default; required in production.
     */
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    /** Public origin used by Better Auth for callbacks and redirects. */
    BETTER_AUTH_URL: z.url().optional(),
    /** GitHub OAuth App credentials. Both or neither must be set. */
    GITHUB_CLIENT_ID: optionalOAuthCredential,
    GITHUB_CLIENT_SECRET: optionalOAuthCredential,
    /** Google OAuth client credentials. Both or neither must be set. */
    GOOGLE_CLIENT_ID: optionalOAuthCredential,
    GOOGLE_CLIENT_SECRET: optionalOAuthCredential,
  })
  .superRefine((value, ctx) => {
    const pairs = [
      {
        provider: "GitHub",
        clientId: "GITHUB_CLIENT_ID",
        clientSecret: "GITHUB_CLIENT_SECRET",
      },
      {
        provider: "Google",
        clientId: "GOOGLE_CLIENT_ID",
        clientSecret: "GOOGLE_CLIENT_SECRET",
      },
    ] as const;

    for (const pair of pairs) {
      const hasClientId = Boolean(value[pair.clientId]);
      const hasClientSecret = Boolean(value[pair.clientSecret]);

      if (hasClientId === hasClientSecret) {
        continue;
      }

      ctx.addIssue({
        code: "custom",
        message: `${pair.provider} OAuth requires both ${pair.clientId} and ${pair.clientSecret}.`,
        path: [hasClientId ? pair.clientSecret : pair.clientId],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = parsed.data;
