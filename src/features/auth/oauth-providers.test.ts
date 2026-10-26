import { describe, expect, it } from "vitest";

import {
  getEnabledOAuthProviders,
  isOAuthError,
  isOAuthProviderConfigured,
} from "./oauth-providers";

const ALL_CREDENTIALS = {
  GITHUB_CLIENT_ID: "github-id",
  GITHUB_CLIENT_SECRET: "github-secret",
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
};

describe("getEnabledOAuthProviders", () => {
  it("returns both providers when all four variables exist", () => {
    expect(getEnabledOAuthProviders(ALL_CREDENTIALS)).toEqual([
      "github",
      "google",
    ]);
  });

  it("returns only the fully configured provider", () => {
    expect(
      getEnabledOAuthProviders({
        GITHUB_CLIENT_ID: "github-id",
        GITHUB_CLIENT_SECRET: "github-secret",
        GOOGLE_CLIENT_ID: "google-id",
      }),
    ).toEqual(["github"]);
  });

  it("returns an empty list when nothing is configured", () => {
    expect(getEnabledOAuthProviders({})).toEqual([]);
  });

  it("treats empty strings as missing credentials", () => {
    expect(
      getEnabledOAuthProviders({
        GITHUB_CLIENT_ID: "",
        GITHUB_CLIENT_SECRET: "github-secret",
      }),
    ).toEqual([]);
  });
});

describe("isOAuthError", () => {
  it("detects the oauth marker", () => {
    expect(isOAuthError("oauth")).toBe(true);
    expect(isOAuthError(undefined)).toBe(false);
    expect(isOAuthError("access_denied")).toBe(false);
  });

  it("detects the marker when Better Auth appends its own error code", () => {
    expect(isOAuthError(["oauth", "access_denied"])).toBe(true);
    expect(isOAuthError(["access_denied"])).toBe(false);
  });
});

describe("isOAuthProviderConfigured", () => {
  it("requires both halves of the credential pair", () => {
    expect(
      isOAuthProviderConfigured("google", { GOOGLE_CLIENT_ID: "google-id" }),
    ).toBe(false);
    expect(
      isOAuthProviderConfigured("google", {
        GOOGLE_CLIENT_ID: "google-id",
        GOOGLE_CLIENT_SECRET: "google-secret",
      }),
    ).toBe(true);
  });
});
