import { describe, expect, it } from "vitest";

import { envSchema } from "./env";

const BASE_ENV = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:password@localhost:5432/devgnosis",
  DATABASE_URL_POOLED: "postgresql://user:password@localhost:5432/devgnosis",
} as const;

describe("envSchema OAuth credentials", () => {
  it("accepts a complete provider pair", () => {
    const result = envSchema.safeParse({
      ...BASE_ENV,
      GITHUB_CLIENT_ID: "github-id",
      GITHUB_CLIENT_SECRET: "github-secret",
    });

    expect(result.success).toBe(true);
  });

  it("accepts no OAuth credentials", () => {
    expect(envSchema.safeParse(BASE_ENV).success).toBe(true);
  });

  it("rejects a provider with only a client ID", () => {
    const result = envSchema.safeParse({
      ...BASE_ENV,
      GITHUB_CLIENT_ID: "github-id",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["GITHUB_CLIENT_SECRET"]);
    }
  });

  it("rejects a provider with only a client secret", () => {
    const result = envSchema.safeParse({
      ...BASE_ENV,
      GOOGLE_CLIENT_SECRET: "google-secret",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["GOOGLE_CLIENT_ID"]);
    }
  });

  it("treats blank values as absent", () => {
    expect(
      envSchema.safeParse({
        ...BASE_ENV,
        GITHUB_CLIENT_ID: "",
        GITHUB_CLIENT_SECRET: "",
        GOOGLE_CLIENT_ID: "   ",
        GOOGLE_CLIENT_SECRET: "   ",
      }).success,
    ).toBe(true);
  });
});

describe("envSchema AUTH_EMAIL_SIGN_UP_ENABLED", () => {
  it("accepts explicit true and false strings", () => {
    expect(
      envSchema.parse({
        ...BASE_ENV,
        AUTH_EMAIL_SIGN_UP_ENABLED: "true",
      }).AUTH_EMAIL_SIGN_UP_ENABLED,
    ).toBe(true);
    expect(
      envSchema.parse({
        ...BASE_ENV,
        AUTH_EMAIL_SIGN_UP_ENABLED: "false",
      }).AUTH_EMAIL_SIGN_UP_ENABLED,
    ).toBe(false);
  });

  it("defaults to false in every environment", () => {
    expect(envSchema.parse(BASE_ENV).AUTH_EMAIL_SIGN_UP_ENABLED).toBe(false);
    expect(
      envSchema.parse({
        ...BASE_ENV,
        NODE_ENV: "production",
      }).AUTH_EMAIL_SIGN_UP_ENABLED,
    ).toBe(false);
  });
});
