import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  signInEmail: vi.fn(),
  redirect: vi.fn(),
  headers: vi.fn(),
  env: {
    GITHUB_CLIENT_ID: "github-id",
    GITHUB_CLIENT_SECRET: "github-secret",
    AUTH_EMAIL_SIGN_UP_ENABLED: true,
  },
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
vi.mock("@/lib/env", () => ({ env: mocks.env }));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  signInAction,
  signInWithProviderAction,
  signUpAction,
  type OAuthActionState,
  type SignInState,
  type SignUpState,
} from "./auth";
import { OAUTH_FAILURE_MESSAGE } from "@/features/auth/oauth-providers";
import {
  AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  resetAuthAttempts,
} from "@/lib/rate-limit";

class RedirectSignal extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`Redirected to ${url}`);
    this.url = url;
  }
}

const OAUTH_INITIAL: OAuthActionState = { error: null };
const SIGN_IN_INITIAL: SignInState = { error: null };
const SIGN_UP_INITIAL: SignUpState = { error: null };
const TOO_MANY_ATTEMPTS_MESSAGE =
  "Too many attempts. Wait a few minutes and try again.";
const SIGN_UP_CLOSED_MESSAGE =
  "Email and password sign-ups are closed. Continue with GitHub or Google, or use the demo account.";

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
  resetAuthAttempts();
  mocks.env.AUTH_EMAIL_SIGN_UP_ENABLED = true;
  mocks.headers.mockResolvedValue(
    new Headers({ "x-forwarded-for": "203.0.113.7" }),
  );
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

describe("signInAction", () => {
  it("signs in and redirects while under the rate limit", async () => {
    mocks.signInEmail.mockResolvedValue({ token: "session-token" });

    await expect(
      signInAction(
        SIGN_IN_INITIAL,
        toFormData({ email: "ada@example.com", password: "correct-horse" }),
      ),
    ).rejects.toMatchObject({ url: "/dashboard" });

    expect(mocks.signInEmail).toHaveBeenCalledTimes(1);
  });

  it("blocks further attempts once the limit is reached", async () => {
    mocks.signInEmail.mockRejectedValue(new Error("Invalid credentials"));

    const formData = toFormData({
      email: "ada@example.com",
      password: "wrong-password",
    });

    for (
      let attempt = 1;
      attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const state = await signInAction(SIGN_IN_INITIAL, formData);

      expect(state.error).toBe("Invalid email or password.");
    }

    const blocked = await signInAction(SIGN_IN_INITIAL, formData);

    expect(blocked.error).toBe(TOO_MANY_ATTEMPTS_MESSAGE);
    expect(mocks.signInEmail).toHaveBeenCalledTimes(
      AUTH_RATE_LIMIT_MAX_ATTEMPTS,
    );
  });

  it("resets the budget after a successful sign-in", async () => {
    const failedForm = toFormData({
      email: "ada@example.com",
      password: "wrong-password",
    });

    mocks.signInEmail.mockRejectedValue(new Error("Invalid credentials"));

    for (
      let attempt = 1;
      attempt < AUTH_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      await signInAction(SIGN_IN_INITIAL, failedForm);
    }

    mocks.signInEmail.mockResolvedValue({ token: "session-token" });

    await expect(
      signInAction(
        SIGN_IN_INITIAL,
        toFormData({ email: "ada@example.com", password: "correct-horse" }),
      ),
    ).rejects.toMatchObject({ url: "/dashboard" });

    mocks.signInEmail.mockRejectedValue(new Error("Invalid credentials"));

    for (
      let attempt = 1;
      attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const state = await signInAction(SIGN_IN_INITIAL, failedForm);

      expect(state.error).toBe("Invalid email or password.");
    }
  });
});

describe("signUpAction", () => {
  it("returns the closed message when email/password sign-up is disabled", async () => {
    mocks.env.AUTH_EMAIL_SIGN_UP_ENABLED = false;

    const state = await signUpAction(
      SIGN_UP_INITIAL,
      toFormData(VALID_SIGN_UP),
    );

    expect(state.error).toBe(SIGN_UP_CLOSED_MESSAGE);
    expect(mocks.signUpEmail).not.toHaveBeenCalled();
  });

  it("maps Better Auth's disabled sign-up error to the closed message", async () => {
    mocks.signUpEmail.mockRejectedValue(
      APIError.from("FORBIDDEN", {
        code: "EMAIL_PASSWORD_SIGN_UP_DISABLED",
        message: "Email and password sign-up is disabled",
      }),
    );

    const state = await signUpAction(
      SIGN_UP_INITIAL,
      toFormData(VALID_SIGN_UP),
    );

    expect(state.error).toBe(SIGN_UP_CLOSED_MESSAGE);
  });

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

  it("blocks further attempts once the limit is reached", async () => {
    mocks.signUpEmail.mockRejectedValue(new Error("database unavailable"));

    const formData = toFormData({
      ...VALID_SIGN_UP,
      email: "rate-limit@example.com",
    });

    for (
      let attempt = 1;
      attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const state = await signUpAction(SIGN_UP_INITIAL, formData);

      expect(state.error).toBe("Could not create your account. Try again.");
    }

    const blocked = await signUpAction(SIGN_UP_INITIAL, formData);

    expect(blocked.error).toBe(TOO_MANY_ATTEMPTS_MESSAGE);
    expect(mocks.signUpEmail).toHaveBeenCalledTimes(
      AUTH_RATE_LIMIT_MAX_ATTEMPTS,
    );
  });

  it("resets the budget after a successful sign-up", async () => {
    const formData = toFormData(VALID_SIGN_UP);

    mocks.signUpEmail.mockRejectedValue(new Error("database unavailable"));

    for (
      let attempt = 1;
      attempt < AUTH_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      await signUpAction(SIGN_UP_INITIAL, formData);
    }

    mocks.signUpEmail.mockResolvedValue({ token: "session-token" });

    await expect(
      signUpAction(SIGN_UP_INITIAL, formData),
    ).rejects.toMatchObject({ url: "/dashboard" });

    mocks.signUpEmail.mockRejectedValue(new Error("database unavailable"));

    for (
      let attempt = 1;
      attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const state = await signUpAction(SIGN_UP_INITIAL, formData);

      expect(state.error).toBe("Could not create your account. Try again.");
    }
  });
});
