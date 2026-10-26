# Sign-up & OAuth Providers Spec — Email, GitHub & Google

## Overview

Add a dedicated `/sign-up` page with email/password registration, plus GitHub
and Google OAuth on both `/sign-in` and `/sign-up`, so users can create an
account or sign in with any of the three methods. The existing email/password
sign-in flow stays unchanged.

Better Auth already supports both providers, and the Drizzle schema already has
the `account` table it needs. The work is configuration, OAuth app
registration, a Better Auth route handler, a sign-up form/action, and shared
provider buttons on both auth pages.

## Status

Completed on branch `feature/auth-signup-oauth`.

**Planned branch:** `feature/auth-signup-oauth`.

## Goals

- Users can sign in **or sign up** with GitHub.
- Users can sign in **or sign up** with Google.
- A dedicated `/sign-up` page supports email/password registration and both
  OAuth providers.
- A first-time OAuth user is provisioned automatically (`user` + `account` rows).
- Existing email/password sign-in continues to work.
- The app fails safely when a provider's credentials are absent.

## Non-goals

- Automatic linking for existing unverified email/password accounts.
- Email verification, password reset, and account-linking/account-management
  UI.
- OAuth on Vercel Preview deployments (each preview has a unique URL that must
  be registered with the provider; see [Known limitations](#known-limitations)).
- Fetching provider-specific data beyond the default profile (`name`, `email`,
  `image`).

## Requirements

### Configuration

1. Register a GitHub OAuth App and a Google OAuth client (see
   [Manual setup](#manual-setup)).
2. Add four environment variables to `.env`, `.env.example`, and Vercel
   (Production and Preview):

   ```dotenv
   GITHUB_CLIENT_ID=""
   GITHUB_CLIENT_SECRET=""
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   ```

3. Validate the variables in `src/lib/env.ts`:
   - Each variable is optional so local development can run without OAuth.
   - A provider is enabled only when **both** its ID and secret are present.
   - Setting only one half of a pair is a configuration error and must fail
     fast at startup.
4. `BETTER_AUTH_URL` must be the deployed origin in each environment:
   - Local: `http://localhost:3000`
   - Production: `https://devgnosis.vercel.app` (no trailing slash)

### Better Auth

1. Add `socialProviders` to `src/lib/auth.ts`, conditionally including each
   provider only when its credentials are configured:

   ```ts
   socialProviders: {
     github: { clientId, clientSecret },
     google: { clientId, clientSecret },
   }
   ```

2. Keep `nextCookies()` as the **last** plugin so the OAuth state cookie is
   forwarded to Next.js.
3. Enable OAuth token encryption at rest:

   ```ts
   account: {
     encryptOAuthTokens: true,
   }
   ```

4. Do **not** weaken account-linking security. Leave Better Auth's default
   `requireLocalEmailVerified: true` in place; see
   [Known limitations](#known-limitations).
5. Use the default provider scopes:
   - GitHub: `read:user user:email`
   - Google: `openid email profile`

### Route handler

The app currently has no Better Auth HTTP handler. OAuth providers redirect the
browser to `/api/auth/callback/:provider`, so this feature must add:

```text
src/app/api/auth/[...all]/route.ts
```

It must export `GET` and `POST` using `toNextJsHandler(auth)` from
`better-auth/next-js`.

### UI

1. Add a social-provider section above the email/password form on both
   `/sign-in` and `/sign-up`:
   - "Continue with GitHub"
   - "Continue with Google"
2. Add a link between the two pages: "Need an account? Sign up" on `/sign-in`
   and "Already have an account? Sign in" on `/sign-up`.
3. Both pages are Server Components. Resolve enabled providers on the server
   and pass only a serializable `OAuthProvider[]` to the client components.
   Never pass client IDs or secrets.
4. If no provider is configured, render nothing (no broken or disabled buttons).
5. Buttons must be keyboard operable, have visible focus states, and show a
   pending state while the redirect is being prepared.
6. Use inline GitHub/Google brand SVGs. Do not add an icon dependency; Lucide's
   brand-icon coverage is not guaranteed.

### Server actions

Add both actions to `src/actions/auth.ts`.

**`signInWithProviderAction`:**

1. Parse and validate `provider` with Zod (`"github" | "google"`).
2. Reject providers that are not currently configured.
3. Call `auth.api.signInSocial` with:
   - `provider`
   - `callbackURL: "/dashboard"`
   - `errorCallbackURL: "/<current-page>?error=oauth"` (the form passes its
     page, or the action accepts a validated `redirectPage`)
   - `headers: await headers()`
4. Redirect to the returned authorization URL.
5. Keep `redirect()` outside the `try/catch` (it throws by design).
6. Return a generic, safe error message on failure. Do not expose provider
   errors, tokens, or stack traces.

**`signUpAction`:**

1. Validate with Zod:
   - `name`: trimmed, 1–80 characters
   - `email`: trimmed, lowercased, valid email
   - `password`: 8–128 characters (Better Auth's defaults)
   - `confirmPassword`: must equal `password`
2. Call `auth.api.signUpEmail` with `{ name, email, password }` and
   `headers: await headers()`.
3. Return safe inline errors:
   - Invalid input: "Enter a valid name, email address, and password."
   - Existing account: "An account with this email already exists. Sign in
     instead."
   - Unexpected failure: "Could not create your account. Try again."
4. Redirect to `/dashboard` on success. Better Auth's default `autoSignIn`
   creates the session, and `nextCookies()` persists it.
5. Keep `redirect()` outside the `try/catch`.

### Email/password sign-up form

- Add `src/components/auth/sign-up-form.tsx` using `useActionState`, mirroring
  the sign-in form.
- Fields: name, email, password, confirm password.
- Use `autoComplete="name"`, `email`, `new-password`.
- Associate every error with the relevant input via `aria-describedby` and
  `aria-invalid`; use `role="alert"` for the form-level error.
- Show a pending label ("Creating account…") and disable the submit button.
- Do not prefill or log credentials.

### Error handling

- `/sign-in?error=oauth` displays: "Could not sign in with that provider. Try
  again or use email and password."
- `/sign-up?error=oauth` displays: "Could not sign up with that provider. Try
  again or use email and password."
- Cancelled or denied consent returns to the originating page with the same
  safe message.
- Provider/network failures are handled without crashing the page.
- Do not log OAuth tokens, authorization codes, passwords, or full provider
  payloads.

## Decisions

- **No database migration.** The existing Better Auth `account` table already
  stores provider accounts, tokens, and profile metadata.
- **OAuth is both sign-in and sign-up.** Better Auth creates a user
  automatically on first OAuth sign-in unless `disableImplicitSignUp` is set;
  this feature leaves implicit sign-up enabled.
- **Dedicated `/sign-up` page.** It combines email/password registration with
  the same OAuth buttons used on `/sign-in`, so users have one obvious place to
  create an account. OAuth on `/sign-in` still creates accounts for first-time
  users.
- **Email/password sign-up stays on the Server Action path.** `signUpEmail`
  plus `nextCookies()` signs the user in immediately; no client auth SDK is
  added.
- **Server Action over a client SDK.** It matches the existing sign-in pattern
  and avoids adding a browser-side auth client. The new route handler is still
  required for the provider callback.
- **Optional credentials, conditional providers.** Contributors can run the app
  with email/password only; CI and local builds must not require OAuth secrets.
- **Paired credentials.** A half-configured provider fails validation rather
  than silently disappearing.
- **Secure linking defaults.** Existing email/password users are not
  automatically linked to a social identity until their local email is
  verified. See known limitations.
- **Encrypted OAuth tokens.** Tokens are encrypted with the Better Auth secret
  before storage.
- **No profile row required.** `getUserPlan()` already falls back to `free`
  when `user_profiles` has no row, so OAuth users land on the empty dashboard
  without extra provisioning.

## Manual setup

### GitHub

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** →
   **New OAuth App**.
2. Production app:
   - **Homepage URL:** `https://devgnosis.vercel.app`
   - **Authorization callback URL:**
     `https://devgnosis.vercel.app/api/auth/callback/github`
3. Create a second app for local development:
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:**
     `http://localhost:3000/api/auth/callback/github`
4. GitHub OAuth Apps allow one callback URL each, so use the local app's
   credentials in `.env` and the production app's credentials in Vercel.

### Google

1. Google Cloud Console → create/select a project.
2. **APIs & Services** → **OAuth consent screen**:
   - User type: **External**
   - While in **Testing**, add the Google accounts that may sign in as test
     users. Publish the app before opening it to the public.
3. **Credentials** → **Create credentials** → **OAuth client ID** →
   **Web application**.
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://devgnosis.vercel.app`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://devgnosis.vercel.app/api/auth/callback/google`
6. One Google client can serve both local and production.

### Vercel

Add all four credentials plus `BETTER_AUTH_URL` to **Production** and
**Preview**, then redeploy. Environment changes do not apply to existing
deployments.

## Implementation

| File | Change |
| --- | --- |
| `src/lib/env.ts` | Add four optional OAuth vars with paired validation. |
| `src/lib/auth.ts` | Add conditional `socialProviders`, `encryptOAuthTokens`. |
| `src/app/api/auth/[...all]/route.ts` | New Better Auth `GET`/`POST` handler. |
| `src/actions/auth.ts` | Add `signInWithProviderAction` and `signUpAction`. |
| `src/features/auth/oauth-providers.ts` | New pure provider constants/types and `getEnabledOAuthProviders(env)`. |
| `src/components/auth/social-provider-buttons.tsx` | New client component (provider buttons + pending/error state). |
| `src/components/auth/provider-icons.tsx` | Inline GitHub/Google SVGs. |
| `src/components/auth/sign-in-form.tsx` | Keep email/password sign-in unchanged. |
| `src/components/auth/sign-up-form.tsx` | New client form (name, email, password, confirm password). |
| `src/app/sign-in/page.tsx` | Resolve enabled providers; render OAuth error message; link to `/sign-up`. |
| `src/app/sign-up/page.tsx` | New route with OAuth buttons, sign-up form, and link to `/sign-in`. |
| `.env.example` | Document the four new variables and callback URLs. |
| `src/lib/auth-session.ts` | Add `requireGuest()` so signed-in browsers skip the auth pages. |
| `src/components/auth/sign-out-button.tsx` | New client control that ends the session and returns to `/sign-in`. |
| `src/components/dashboard/sidebar.tsx` | Render the sign-out control in the sidebar user block. |
| `context/current-feature.md` | Mark this feature current/in progress, then completed. |

## Test plan

### Unit (Vitest)

- `getEnabledOAuthProviders` returns both providers when all four vars exist.
- Returns only the fully configured provider when one pair is complete.
- Returns an empty list when nothing is configured.
- Rejects a half-configured pair via the env schema.
- The provider action rejects unconfigured providers and invalid values.
- The sign-up schema rejects mismatched passwords, short passwords, and invalid
  emails.

### Manual

- [ ] Email/password sign-up from `/sign-up` creates an account, signs in, and
      lands on `/dashboard`.
- [ ] Duplicate email sign-up returns the safe "account already exists" error.
- [ ] GitHub sign-up from `/sign-up` creates a user and lands on `/dashboard`.
- [ ] Google sign-up from `/sign-up` creates a user and lands on `/dashboard`.
- [ ] GitHub/Google sign-in from `/sign-in` also works.
- [ ] A new user sees the empty dashboard with `free` entitlements.
- [ ] Cancelling/denying OAuth consent returns to the originating page with a
      safe message.
- [ ] Existing email/password sign-in still works.
- [ ] Signing in again with the same provider reuses the existing user.
- [ ] OAuth buttons are hidden when credentials are absent.
- [ ] Sign-out clears the session cookie and `/dashboard` redirects to
      `/sign-in`.
- [ ] A signed-in browser visiting `/sign-in` or `/sign-up` is redirected to
      `/dashboard`.
- [ ] Production sign-up/sign-in flows complete on
      `https://devgnosis.vercel.app`.
- [ ] `bun run lint`, `bunx next typegen && bunx tsc --noEmit`,
      `bun run test`, and `bun run build` pass.

## Acceptance checks

- `/sign-up` renders the email/password form and configured OAuth buttons.
- `/sign-in` and `/sign-up` link to each other.
- Email/password sign-up creates the account, signs the user in, and redirects
  to `/dashboard`.
- GitHub and Google appear on both pages when configured.
- Either provider can create an account and sign in.
- Better Auth persists a session cookie and redirects to `/dashboard`.
- First-time OAuth users get `user` and `account` rows; no migration is needed.
- `user_profiles` absence does not break the dashboard.
- Secrets never reach the client bundle.
- The app builds and starts without OAuth credentials (providers disabled).
- All quality gates pass.

## Known limitations

- **Existing email/password accounts are not auto-linked** to GitHub/Google.
  Their `user.emailVerified` is `false`, and Better Auth's default
  `requireLocalEmailVerified: true` blocks implicit linking to prevent account
  takeover. Users must continue with the method they originally used. Do not
  set `requireLocalEmailVerified: false` without implementing email
  verification.
- **Preview deployments** receive unique URLs, and Google/GitHub require exact
  callback URLs. Test OAuth on the production domain or a stable branch alias.
  Supporting per-preview OAuth requires deriving `baseURL` from `VERCEL_URL`
  plus registering those origins/callbacks.
- **Google Testing mode** limits sign-in to explicitly added test users.
- **No avatar UI.** Provider profile images are stored in `user.image` but the
  sidebar does not display them yet.

## Follow-ups

- Implement email verification so existing email/password users can safely link
  GitHub/Google accounts.
- Add explicit account linking (`linkSocial`) and account management.
- Add email verification and password reset.
- Add OAuth support for preview deployments if previews become part of the
  review workflow.

## Open questions

None. Production origin is `https://devgnosis.vercel.app`; the dedicated
`/sign-up` page is in scope.
