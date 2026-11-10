"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  isOAuthProviderConfigured,
  OAUTH_FAILURE_MESSAGE,
} from "@/features/auth/oauth-providers";
import {
  oauthSignInSchema,
  SIGN_UP_FIELDS,
  signUpSchema,
  type SignUpField,
} from "@/features/auth/schemas";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  buildAuthAttemptKey,
  clearAuthAttempt,
  consumeAuthAttempt,
  getClientIp,
} from "@/lib/rate-limit";

/** Result shape consumed by `useActionState` in the sign-in form. */
export type SignInState = {
  error: string | null;
};

/** Result shape consumed by `useActionState` in the OAuth buttons. */
export type OAuthActionState = {
  error: string | null;
};

/** Result shape consumed by `useActionState` in the sign-up form. */
export type SignUpState = {
  error: string | null;
  fieldErrors?: Partial<Record<SignUpField, string>>;
};

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

const SIGN_UP_INVALID_MESSAGE =
  "Enter a valid name, email address, and password.";
const SIGN_UP_DUPLICATE_MESSAGE =
  "An account with this email already exists. Sign in instead.";
const SIGN_UP_FAILURE_MESSAGE = "Could not create your account. Try again.";
const SIGN_UP_CLOSED_MESSAGE =
  "Email and password sign-ups are closed. Continue with GitHub or Google, or use the demo account.";
const TOO_MANY_ATTEMPTS_MESSAGE =
  "Too many attempts. Wait a few minutes and try again.";

const DUPLICATE_ACCOUNT_CODES = new Set([
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
]);

function isDuplicateAccountError(error: unknown): boolean {
  if (!isAPIError(error)) {
    return false;
  }

  const code = error.body?.code;
  return typeof code === "string" && DUPLICATE_ACCOUNT_CODES.has(code);
}

function isEmailSignUpDisabledError(error: unknown): boolean {
  return (
    isAPIError(error) &&
    error.body?.code === "EMAIL_PASSWORD_SIGN_UP_DISABLED"
  );
}

/**
 * Minimal email/password sign-in. Better Auth owns credential verification and
 * cookie handling (via the `nextCookies` plugin); failures return a safe,
 * generic message without provider or stack details.
 */
export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  const requestHeaders = await headers();
  const attemptKey = buildAuthAttemptKey(
    getClientIp(requestHeaders),
    parsed.data.email,
  );

  if (!consumeAuthAttempt(attemptKey)) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: requestHeaders,
    });
  } catch {
    return { error: "Invalid email or password." };
  }

  clearAuthAttempt(attemptKey);

  // `redirect` throws, so it stays outside the try/catch.
  redirect("/dashboard");
}

/**
 * Start a GitHub/Google OAuth flow. Only configured providers are accepted and
 * the page is validated so the error callback cannot be used as an open
 * redirect. Provider details never reach the client.
 */
export async function signInWithProviderAction(
  _previousState: OAuthActionState,
  formData: FormData,
): Promise<OAuthActionState> {
  const parsed = oauthSignInSchema.safeParse({
    provider: formData.get("provider"),
    redirectPage: formData.get("redirectPage"),
  });

  if (
    !parsed.success ||
    !isOAuthProviderConfigured(parsed.data.provider, env)
  ) {
    return { error: OAUTH_FAILURE_MESSAGE };
  }

  let authorizationUrl: string | undefined;

  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: parsed.data.provider,
        callbackURL: "/dashboard",
        errorCallbackURL: `/${parsed.data.redirectPage}?error=oauth`,
      },
      headers: await headers(),
    });

    authorizationUrl = result.url;
  } catch {
    return { error: OAUTH_FAILURE_MESSAGE };
  }

  if (!authorizationUrl) {
    return { error: OAUTH_FAILURE_MESSAGE };
  }

  // `redirect` throws, so it stays outside the try/catch.
  redirect(authorizationUrl);
}

/**
 * Create an email/password account. Better Auth's default `autoSignIn` creates
 * the session and `nextCookies()` persists it before the dashboard redirect.
 */
export async function signUpAction(
  _previousState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  if (!env.AUTH_EMAIL_SIGN_UP_ENABLED) {
    return { error: SIGN_UP_CLOSED_MESSAGE };
  }

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<SignUpField, string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        (SIGN_UP_FIELDS as readonly string[]).includes(field)
      ) {
        const key = field as SignUpField;
        fieldErrors[key] ??= issue.message;
      }
    }

    return { error: SIGN_UP_INVALID_MESSAGE, fieldErrors };
  }

  const requestHeaders = await headers();
  const attemptKey = buildAuthAttemptKey(
    getClientIp(requestHeaders),
    parsed.data.email,
  );

  if (!consumeAuthAttempt(attemptKey)) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: requestHeaders,
    });
  } catch (error) {
    if (isEmailSignUpDisabledError(error)) {
      return { error: SIGN_UP_CLOSED_MESSAGE };
    }

    if (isDuplicateAccountError(error)) {
      return { error: SIGN_UP_DUPLICATE_MESSAGE };
    }

    return { error: SIGN_UP_FAILURE_MESSAGE };
  }

  clearAuthAttempt(attemptKey);

  // `redirect` throws, so it stays outside the try/catch.
  redirect("/dashboard");
}

/**
 * End the current session. Better Auth clears the session cookie through the
 * `nextCookies` plugin; a missing or already-invalid session still lands the
 * user on `/sign-in` instead of surfacing an error.
 */
export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Nothing to revoke — fall through to the redirect below.
  }

  // `redirect` throws, so it stays outside the try/catch.
  redirect("/sign-in");
}

