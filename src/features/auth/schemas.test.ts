import { describe, expect, it } from "vitest";

import { oauthSignInSchema, signUpSchema } from "./schemas";

const VALID_SIGN_UP = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

describe("signUpSchema", () => {
  it("accepts valid input and normalizes name and email", () => {
    const result = signUpSchema.safeParse({
      ...VALID_SIGN_UP,
      name: "  Ada Lovelace  ",
      email: "  ADA@Example.COM ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada Lovelace");
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      ...VALID_SIGN_UP,
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      ...VALID_SIGN_UP,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["password"]);
    }
  });

  it("rejects invalid email addresses", () => {
    const result = signUpSchema.safeParse({
      ...VALID_SIGN_UP,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["email"]);
    }
  });

  it("rejects a blank name", () => {
    const result = signUpSchema.safeParse({ ...VALID_SIGN_UP, name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["name"]);
    }
  });

  it("rejects names longer than 80 characters", () => {
    const result = signUpSchema.safeParse({
      ...VALID_SIGN_UP,
      name: "a".repeat(81),
    });

    expect(result.success).toBe(false);
  });
});

describe("oauthSignInSchema", () => {
  it("accepts the supported providers and pages", () => {
    expect(
      oauthSignInSchema.safeParse({
        provider: "github",
        redirectPage: "sign-up",
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported providers", () => {
    expect(
      oauthSignInSchema.safeParse({
        provider: "facebook",
        redirectPage: "sign-in",
      }).success,
    ).toBe(false);
  });

  it("rejects unvalidated redirect pages", () => {
    expect(
      oauthSignInSchema.safeParse({
        provider: "google",
        redirectPage: "https://evil.example.com",
      }).success,
    ).toBe(false);
  });
});
