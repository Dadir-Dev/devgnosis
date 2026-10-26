import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  signInEmail: vi.fn(),
  redirect: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInSocial: mocks.signInSocial,
      signUpEmail: mocks.signUpEmail,
      signInEmail: mocks.signInEmail,
    },
  },
}));

// GitHub is configured; Google is not.
vi.mock("@/lib/env", () => ({
  env: {
    GITHUB_CLIENT_ID: "github-id",
    GITHUB_CLIENT_SECRET: "github-secret",
  },
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  signInWithProviderAction,
  signUpAction,
  type OAuthActionState,
  type SignUpState,
} from "./auth";
import { OAUTH_FAILURE_MESSAGE } from "@/features/auth/oauth-providers";

class RedirectSignal extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`Redirected to ${url}`);
    this.url = url;
  }
}

const OAUTH_INITIAL: OAuthActionState = { error: null };
const SIGN_UP_INITIAL: SignUpState = { error: null };

function toFormData(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

const VALID_SIGN_UP = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers());
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url);
  });
});

describe("signInWithProviderAction", () => {
  it("rejects an invalid provider value", async () => {
    const state = await signInWithProviderAction(
      OAUTH_INITIAL,
      toFormData({ provider: "facebook", redirectPage: "sign-in" }),
    );

    expect(state.error).toBe(OAUTH_FAILURE_MESSAGE);
    expect(mocks.signInSocial).not.toHaveBeenCalled();
  });

  it("rejects a provider that is not configured", async () => {
    const state = await signInWithProviderAction(
      OAUTH_INITIAL,
      toFormData({ provider: "google", redirectPage: "sign-up" }),
    );

    expect(state.error).toBe(OAUTH_FAILURE_MESSAGE);
    expect(mocks.signInSocial).not.toHaveBeenCalled();
  });

  it("redirects to the returned authorization URL", async () => {
    const authorizationUrl =
      "https://github.com/login/oauth/authorize?client_id=github-id";
    mocks.signInSocial.mockResolvedValue({
      url: authorizationUrl,
      redirect: true,
    });

    await expect(
      signInWithProviderAction(
        OAUTH_INITIAL,
        toFormData({ provider: "github", redirectPage: "sign-up" }),
      ),
    ).rejects.toMatchObject({ url: authorizationUrl });

    expect(mocks.signInSocial).toHaveBeenCalledWith({
      body: {
        provider: "github",
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-up?error=oauth",
      },
      headers: expect.any(Headers),
    });
    expect(mocks.redirect).toHaveBeenCalledWith(authorizationUrl);
  });

  it("returns a safe error when the provider call fails", async () => {
    mocks.signInSocial.mockRejectedValue(
      new Error("provider failed with token=secret"),
    );

    const state = await signInWithProviderAction(
      OAUTH_INITIAL,
      toFormData({ provider: "github", redirectPage: "sign-in" }),
    );

    expect(state.error).toBe(OAUTH_FAILURE_MESSAGE);
    expect(state.error).not.toContain("token");
  });

  it("returns a safe error when no authorization URL is returned", async () => {
    mocks.signInSocial.mockResolvedValue({ redirect: false });

    const state = await signInWithProviderAction(
      OAUTH_INITIAL,
      toFormData({ provider: "github", redirectPage: "sign-in" }),
    );

    expect(state.error).toBe(OAUTH_FAILURE_MESSAGE);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("signUpAction", () => {
  it("creates an account and redirects to the dashboard", async () => {
    mocks.signUpEmail.mockResolvedValue({ token: "session-token" });

    await expect(
      signUpAction(SIGN_UP_INITIAL, toFormData(VALID_SIGN_UP)),
    ).rejects.toMatchObject({ url: "/dashboard" });

    expect(mocks.signUpEmail).toHaveBeenCalledWith({
      body: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "correct-horse",
      },
      headers: expect.any(Headers),
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns field errors for mismatched passwords", async () => {
    const state = await signUpAction(
      SIGN_UP_INITIAL,
      toFormData({ ...VALID_SIGN_UP, confirmPassword: "different-password" }),
    );

    expect(state.error).toBe(
      "Enter a valid name, email address, and password.",
    );
    expect(state.fieldErrors?.confirmPassword).toBe("Passwords do not match.");
    expect(mocks.signUpEmail).not.toHaveBeenCalled();
  });

  it("maps duplicate accounts to a safe message", async () => {
    mocks.signUpEmail.mockRejectedValue(
      APIError.from("UNPROCESSABLE_ENTITY", {
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists",
      }),
    );

    const state = await signUpAction(
      SIGN_UP_INITIAL,
      toFormData(VALID_SIGN_UP),
    );

    expect(state.error).toBe(
      "An account with this email already exists. Sign in instead.",
    );
  });

  it("returns a generic message for unexpected failures", async () => {
    mocks.signUpEmail.mockRejectedValue(new Error("database unavailable"));

    const state = await signUpAction(
      SIGN_UP_INITIAL,
      toFormData(VALID_SIGN_UP),
    );

    expect(state.error).toBe("Could not create your account. Try again.");
  });
});
