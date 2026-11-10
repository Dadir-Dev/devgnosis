import { describe, expect, it } from "vitest";

import {
  getEnabledOAuthProviders,
  getOAuthErrorMessage,
  isOAuthProviderConfigured,
  OAUTH_EMAIL_NOT_VERIFIED_MESSAGE,
  OAUTH_ERROR_MESSAGES,
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

describe("getOAuthErrorMessage", () => {
  it("returns the provider-verification message for an unverified email", () => {
    expect(getOAuthErrorMessage("OAUTH_EMAIL_NOT_VERIFIED", "sign-in")).toBe(
      OAUTH_EMAIL_NOT_VERIFIED_MESSAGE,
    );
    expect(
      getOAuthErrorMessage(
        ["oauth", "OAUTH_EMAIL_NOT_VERIFIED"],
        "sign-up",
      ),
    ).toBe(OAUTH_EMAIL_NOT_VERIFIED_MESSAGE);
  });

  it("returns the generic page message for the oauth marker", () => {
    expect(getOAuthErrorMessage("oauth", "sign-in")).toBe(
      OAUTH_ERROR_MESSAGES["sign-in"],
    );
    expect(getOAuthErrorMessage(["oauth", "access_denied"], "sign-up")).toBe(
      OAUTH_ERROR_MESSAGES["sign-up"],
    );
  });

  it("returns null when neither code is present", () => {
    expect(getOAuthErrorMessage(undefined, "sign-in")).toBeNull();
    expect(getOAuthErrorMessage("access_denied", "sign-in")).toBeNull();
    expect(getOAuthErrorMessage(["access_denied"], "sign-up")).toBeNull();
  });

  it("prefers the specific message over the generic oauth marker", () => {
    expect(
      getOAuthErrorMessage(["OAUTH_EMAIL_NOT_VERIFIED", "oauth"], "sign-in"),
    ).toBe(OAUTH_EMAIL_NOT_VERIFIED_MESSAGE);
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
