/** OAuth providers supported by the auth UI, in display order. */
export const OAUTH_PROVIDERS = ["github", "google"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const OAUTH_PROVIDER_LABELS = {
  github: "GitHub",
  google: "Google",
} as const satisfies Record<OAuthProvider, string>;

/** Auth pages that can start an OAuth flow. */
export const AUTH_PAGES = ["sign-in", "sign-up"] as const;

export type AuthPage = (typeof AUTH_PAGES)[number];

export const OAUTH_ERROR_MESSAGES = {
  "sign-in":
    "Could not sign in with that provider. Try again or use email and password.",
  "sign-up":
    "Could not sign up with that provider. Try again or use email and password.",
} as const satisfies Record<AuthPage, string>;

/** Safe, provider-agnostic failure returned by the Server Action. */
export const OAUTH_FAILURE_MESSAGE =
  "Could not connect to that provider. Try again or use email and password.";

/** Specific failure for OAuth identities whose provider did not verify email. */
export const OAUTH_EMAIL_NOT_VERIFIED_MESSAGE =
  "Your provider did not confirm this email address. Verify it with your provider and try again.";

/**
 * Better Auth appends its own `error` code to `errorCallbackURL`, so the
 * `oauth` marker can arrive alongside a second value (an array in Next.js).
 */
export function getOAuthErrorMessage(
  value: string | string[] | undefined,
  page: AuthPage,
): string | null {
  const codes = Array.isArray(value) ? value : value ? [value] : [];

  if (codes.includes("OAUTH_EMAIL_NOT_VERIFIED")) {
    return OAUTH_EMAIL_NOT_VERIFIED_MESSAGE;
  }

  if (codes.includes("oauth")) {
    return OAUTH_ERROR_MESSAGES[page];
  }

  return null;
}

/** The subset of the parsed server environment that controls OAuth. */
export type OAuthProviderEnv = {
  GITHUB_CLIENT_ID?: string | undefined;
  GITHUB_CLIENT_SECRET?: string | undefined;
  GOOGLE_CLIENT_ID?: string | undefined;
  GOOGLE_CLIENT_SECRET?: string | undefined;
};

const PROVIDER_CREDENTIAL_KEYS = {
  github: {
    clientId: "GITHUB_CLIENT_ID",
    clientSecret: "GITHUB_CLIENT_SECRET",
  },
  google: {
    clientId: "GOOGLE_CLIENT_ID",
    clientSecret: "GOOGLE_CLIENT_SECRET",
  },
} as const satisfies Record<
  OAuthProvider,
  { clientId: keyof OAuthProviderEnv; clientSecret: keyof OAuthProviderEnv }
>;

/** A provider is enabled only when both halves of its credential pair exist. */
export function isOAuthProviderConfigured(
  provider: OAuthProvider,
  env: OAuthProviderEnv,
): boolean {
  const keys = PROVIDER_CREDENTIAL_KEYS[provider];
  return Boolean(env[keys.clientId] && env[keys.clientSecret]);
}

/** Resolve the configured providers in display order. */
export function getEnabledOAuthProviders(
  env: OAuthProviderEnv,
): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((provider) =>
    isOAuthProviderConfigured(provider, env),
  );
}
