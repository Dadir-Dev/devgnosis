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

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /** Neon branch, direct (non-pooler) endpoint — used by drizzle-kit. */
  DATABASE_URL: postgresUrl,
  /** Neon branch, pooled (PgBouncer) endpoint — used by the app at runtime. */
  DATABASE_URL_POOLED: postgresUrl,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = parsed.data;
