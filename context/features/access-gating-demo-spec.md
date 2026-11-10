# Access Gating & Production Demo Account Spec

## Overview

Pre-launch access control for DevGnosis. Production stops accepting
email/password sign-ups and accepts only **verified OAuth identities**
(GitHub/Google) plus the shared demo account. The demo account is provisioned
in the production Neon branch with **no demo collections or items**. A
`/privacy` page is added so the Google OAuth app can be published, and the
demo credentials are shown on the auth pages.

The goal is identity ownership, not anti-abuse: OAuth providers confirm the
email address, and the demo account is the anonymous visitor path. Bots and
quota abuse are handled later with rate limits and entitlements, not by this
feature.

## Status

Spec written; implementation not started.

**Planned branch:** `feature/auth-access-gating-demo`.

**Deferred sibling:** `@context/features/email-verification-spec.md`.

## Goals

- Production no longer accepts email/password sign-ups.
- GitHub and Google sign-up/sign-in remain fully functional.
- OAuth accounts whose provider reports an unverified email are rejected.
- The demo account (`demo@devgnosis.app` / `password123`) exists in the
  production branch with a free plan and no demo content.
- Demo credentials are visible on `/sign-in` and `/sign-up`.
- `/privacy` exists and is linked, so Google OAuth can leave Testing mode.
- The full development seed cannot run against production by accident.

## Non-goals

- Email verification, password reset, and account-management UI (see the
  deferred spec).
- A demo-data reset script (deferred until the first write feature ships).
- Publishing the Google OAuth app (a manual Google Cloud Console step).
- Anti-abuse quotas, disposable-email blocking, or CAPTCHA.
- Account deletion/export.

## Requirements

### 1. Environment flag

Add `AUTH_EMAIL_SIGN_UP_ENABLED` to `src/lib/env.ts` and `.env.example`:

```dotenv
# Email/password sign-up. Closed everywhere by default until email verification
# ships; OAuth sign-up is unaffected. Set to "true" only to test email/password
# sign-up locally.
AUTH_EMAIL_SIGN_UP_ENABLED="false"
```

Validation:

```ts
AUTH_EMAIL_SIGN_UP_ENABLED: z.stringbool().default(false),
```

- Default `false` in every environment, including local development. Local
  testing opts in explicitly with `AUTH_EMAIL_SIGN_UP_ENABLED="true"`.
- The flag controls **email/password sign-up only**. It must not gate OAuth.

### 2. Better Auth configuration

In `src/lib/auth.ts`:

```ts
emailAndPassword: {
  enabled: true,
  disableSignUp: !env.AUTH_EMAIL_SIGN_UP_ENABLED,
},
```

- Do **not** set `disableImplicitSignUp` or provider-level `disableSignUp`.
  OAuth sign-up stays open.
- Keep `account.accountLinking` at its secure defaults
  (`requireLocalEmailVerified: true`).

Add a user-creation hook that rejects unverified OAuth emails:

```ts
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        if (
          !env.AUTH_EMAIL_SIGN_UP_ENABLED &&
          user.emailVerified === false
        ) {
          throw APIError.from("FORBIDDEN", {
            code: "OAUTH_EMAIL_NOT_VERIFIED",
            message:
              "The provider did not confirm this email address. Verify it with the provider and try again.",
          });
        }
      },
    },
  },
},
```

Why this condition:

- The flag is `false` by default, so the only new users are OAuth users. An
  OAuth user with `emailVerified: false` (possible with GitHub) is rejected.
- Locally the flag is also `false`; setting
  `AUTH_EMAIL_SIGN_UP_ENABLED="true"` restores email/password sign-up for
  testing, including unverified users.
- The demo seed writes directly to the database and bypasses the hook.

Better Auth's OAuth callback turns a thrown `APIError` into
`?error=oauth&error=OAUTH_EMAIL_NOT_VERIFIED` on the page's
`errorCallbackURL` (`callback.mjs:191-198`).

### 3. `/sign-up` page

- Render the configured OAuth buttons.
- Render `SignUpForm` **only** when `env.AUTH_EMAIL_SIGN_UP_ENABLED` is true.
- When the form is hidden, render a demo note with the credentials and a link
  to `/sign-in`.
- Keep the "Already have an account? Sign in" link.
- Keep `export const instant = false` because the page reads `searchParams`.

### 4. `/sign-in` page

- Show the demo credentials in every environment. Remove the
  `process.env.NODE_ENV !== "production"` guard.
- Password changes to `password123`.
- Keep the email/password form (it is the demo sign-in path) and the OAuth
  buttons.
- Keep the "Need an account? Sign up" link because OAuth sign-up is open.
- Show the resolved OAuth error message (see requirement 5).

### 5. OAuth error mapping

Replace the boolean `isOAuthError` helper with a resolver in
`src/features/auth/oauth-providers.ts`:

```ts
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
```

Add:

```ts
export const OAUTH_EMAIL_NOT_VERIFIED_MESSAGE =
  "Your provider did not confirm this email address. Verify it with your provider and try again.";
```

Update both auth pages and the tests.

### 6. Server actions

`src/actions/auth.ts`:

- `signUpAction`: when `!env.AUTH_EMAIL_SIGN_UP_ENABLED`, return
  `"Email and password sign-ups are closed. Continue with GitHub or Google, or use the demo account."`
  before calling Better Auth.
- Map Better Auth's `EMAIL_PASSWORD_SIGN_UP_DISABLED` error code to the same
  message (defense in depth).
- `signInWithProviderAction` is unchanged; OAuth sign-up stays enabled.

### 7. Demo account provisioning

The existing `src/db/seed.ts` runs on import and creates the demo user plus
five collections and eighteen items. It also calls `auth.api.signUpEmail`,
which fails once `disableSignUp` is on. Split it.

**New `src/db/system-item-types.ts`**

- Move `SYSTEM_ITEM_TYPES` and `seedSystemItemTypes()` out of `seed.ts`.
- Keep the function idempotent and unchanged.

**New `src/db/demo-account.ts`**

```ts
export const DEMO_USER = {
  email: "demo@devgnosis.app",
  name: "Demo User",
  displayName: "Demo User",
  password: "password123",
} as const;
```

- `ensureDemoUser(): Promise<string>`
  - Find the user by email.
  - If absent, insert the `user` row (`emailVerified: true`) and the
    `credential` `account` row with `hashPassword(DEMO_USER.password)` from
    `better-auth/crypto`.
  - If present, update the name and `emailVerified`, and upsert the credential
    account's password hash so the published password always matches.
  - Use `crypto.randomUUID()` for new ids.
- `ensureDemoProfile(userId): Promise<void>`
  - Upsert `user_profiles` to `plan: "free"`, `planStatus: "active"`,
    `displayName: DEMO_USER.displayName`.
- Both functions bypass Better Auth hooks, so they work with sign-ups disabled.
- No collections, items, tags, or joins are created.

**New `src/db/seed-production.ts`**

Runs, in order:

1. `seedSystemItemTypes()` — app infrastructure, not demo data.
2. `ensureDemoUser()`.
3. `ensureDemoProfile(userId)`.

Logs a short summary and exits non-zero on failure. It must **not** call
`seedCollectionsAndItems()`.

**`src/db/seed.ts`**

- Import the extracted system-type and demo-account helpers.
- Keep the full development seed (system types + demo user/profile +
  collections/items).
- Add a guard at the start of `seed()`:

```ts
if (env.NODE_ENV === "production" || process.env.ALLOW_FULL_SEED !== "1") {
  throw new Error(
    [
      `Refusing to run the full demo seed against ${describeTarget()}.`,
      "It writes demo collections and items, which production must not receive.",
      "Production: use `bun run db:seed:production`.",
      "Development or preview, after confirming the target:",
      '  $env:ALLOW_FULL_SEED="1"; bun run db:seed',
    ].join("\n"),
  );
}
```

The flag is required in every environment because `NODE_ENV` is unset when
`bun` runs the script locally, so a `NODE_ENV`-only check never fires. It is
deliberately **not** stored in `.env`: a value there would be inherited by any
run, including one pointed at production. Set it per command after reading the
target host in the error message.

**`package.json`**

```json
"db:seed:production": "bun --conditions=react-server run src/db/seed-production.ts"
```

**Constraint:** the demo account must never be eligible for billing, AI, or
uploads. Record this in the spec and enforce it when those features ship.

### 8. Privacy page

Add `src/app/privacy/page.tsx` (Server Component, static content):

- What we collect: OAuth profile (`name`, `email`, `image`), saved content,
  session metadata.
- How we use it: authentication, product functionality, abuse prevention.
- Storage and security: Neon PostgreSQL; OAuth tokens encrypted at rest.
- Third parties: GitHub, Google, Vercel, Neon.
- Cookies: session cookie only.
- Retention and deletion: contact the support address.
- Contact: the monitored support email configured in Google Cloud Console.
- Last updated date.

Link `/privacy` from `/sign-in`, `/sign-up`, and the homepage. The page must
be publicly reachable without a session.

**Manual Google Cloud Console setup** (external app, production):

- App name: `DevGnosis`
- User support email: a monitored inbox
- Homepage: `https://devgnosis.vercel.app`
- Privacy policy: `https://devgnosis.vercel.app/privacy`
- Authorized domain: `devgnosis.vercel.app`
- Scopes: `openid`, `email`, `profile` (non-sensitive; no Google verification)
- Publish the app

If Google rejects the Vercel domain as an authorized domain, hide Google in
production and show GitHub plus the demo until a custom domain exists. Do not
ship a button that always fails.

### 9. Documentation

- `context/current-feature.md`: mark this feature active, then completed.
- `context/project-overview.md`:
  - Phase 2: add the email-verification backlog entry.
  - Environments: production receives system item types plus the demo
    account/profile; it never receives demo collections or items.
  - Security rules: email/password sign-up stays disabled until email
    verification ships; OAuth identities must be provider-verified.
- `.env.example`: document `AUTH_EMAIL_SIGN_UP_ENABLED`.

## Decisions

- **OAuth-only public sign-up.** GitHub/Google verify email ownership; the
  email/password form is the demo path.
- **Reject unverified OAuth emails.** GitHub can return an unverified primary
  email; that would reopen the squatting hole.
- **Demo account in production, no items.** The portfolio demo starts from an
  empty dashboard.
- **Public demo password.** `password123` is intentionally visible.
- **Privacy page required.** Google cannot publish an external app without a
  privacy policy URL.
- **Full-seed guard.** Production provisioning is a separate, explicit script.
- **Keep auto-linking.** The same verified email across Google and GitHub maps
  to one account.
- **Preview matches production.** Email/password sign-up is off by default in
  every environment; opt in locally with `AUTH_EMAIL_SIGN_UP_ENABLED="true"`.

## Manual setup

### Vercel

Add to **Production** and **Preview**:

```dotenv
AUTH_EMAIL_SIGN_UP_ENABLED="false"
```

Keep the existing OAuth credentials and `BETTER_AUTH_URL`. Redeploy; env
changes do not apply to existing deployments.

### Neon production branch

Run once with the production connection strings:

```powershell
$env:DATABASE_URL="<production direct URL>"
$env:DATABASE_URL_POOLED="<production pooled URL>"
bun run db:seed:production
```

Verify:

```sql
SELECT id, email, email_verified FROM "user";
SELECT * FROM user_profiles;
SELECT count(*) FROM items;
```

Expected: the demo user, verified, free plan, and zero items.

### Neon preview branch

Preview is seeded like development — demo account, collections, items, tags, and
system item types — so the deployed preview has content to review. Use the
preview branch's own connection strings:

```powershell
$env:DATABASE_URL="<preview direct URL>"
$env:DATABASE_URL_POOLED="<preview pooled URL>"
$env:ALLOW_FULL_SEED="1"
bun run db:seed
```

Never run this step against the `production` branch; production receives only
`db:seed:production`.

### Development branch cleanup

Run only on the `development` branch:

```sql
DELETE FROM "user" WHERE email <> 'demo@devgnosis.app';
```

Cascade removes sessions, accounts, profiles, items, collections, tags, and
custom item types. System item types (`owner_id IS NULL`) survive.

## Implementation

| File | Change |
| --- | --- |
| `src/lib/env.ts` | Add `AUTH_EMAIL_SIGN_UP_ENABLED` (`z.stringbool()`, production default false). |
| `.env.example` | Document the flag. |
| `src/lib/auth.ts` | `disableSignUp` from the flag; reject unverified OAuth users via `databaseHooks.user.create.before`. |
| `src/features/auth/oauth-providers.ts` | Add `getOAuthErrorMessage` and `OAUTH_EMAIL_NOT_VERIFIED_MESSAGE`. |
| `src/app/sign-up/page.tsx` | Render OAuth always; hide `SignUpForm` when disabled; add demo note. |
| `src/app/sign-in/page.tsx` | Always show demo credentials (`password123`); use the error resolver. |
| `src/app/privacy/page.tsx` | New static privacy page. |
| `src/app/page.tsx` | Link `/privacy` (footer or equivalent). |
| `src/actions/auth.ts` | Guard `signUpAction`; map `EMAIL_PASSWORD_SIGN_UP_DISABLED`. |
| `src/db/system-item-types.ts` | New: extracted `SYSTEM_ITEM_TYPES` + `seedSystemItemTypes()`. |
| `src/db/demo-account.ts` | New: `DEMO_USER`, `ensureDemoUser()`, `ensureDemoProfile()`. |
| `src/db/seed-production.ts` | New: system types + demo account/profile only. |
| `src/db/seed.ts` | Import extracted helpers; add production guard. |
| `package.json` | Add `db:seed:production`. |
| `context/current-feature.md` | Mark active, then completed. |
| `context/project-overview.md` | Backlog entry, environment notes, security rule. |

## Test plan

### Unit (Vitest)

- `AUTH_EMAIL_SIGN_UP_ENABLED` defaults to `false` in every environment,
  including local development; accepts `"true"` / `"false"`.
- `signUpAction` returns the closed message when the flag is false and does not
  call `auth.api.signUpEmail`.
- `signUpAction` still creates an account when the flag is true.
- `getOAuthErrorMessage` returns the specific message for
  `OAUTH_EMAIL_NOT_VERIFIED`, the generic page message for `oauth`, and `null`
  otherwise.
- Existing OAuth provider and auth-action tests still pass.

### Manual

- [ ] Local with `AUTH_EMAIL_SIGN_UP_ENABLED="true"`: email/password sign-up
      still works and lands on `/dashboard`.
- [ ] Default (`false`) locally and in production: `/sign-up` shows OAuth
      buttons and the demo note, not the email/password form.
- [ ] Calling `signUpAction` directly with the flag off returns the closed
      message.
- [ ] GitHub and Google create accounts and land on `/dashboard`.
- [ ] A GitHub account with an unverified primary email is rejected with the
      provider-verification message.
- [ ] Demo sign-in works with `demo@devgnosis.app` / `password123`.
- [ ] `/privacy` loads without a session and is linked from the auth pages.
- [ ] `bun run db:seed:production` against a scratch branch creates system item
      types and the demo account, and zero items.
- [ ] `bun run db:seed` refuses without `ALLOW_FULL_SEED=1`, and refuses in
      production regardless.
- [ ] Google OAuth app is published and a non-test Google account can sign in.
- [ ] `bun run gate` passes.

## Acceptance checks

- Production has no email/password sign-up path.
- GitHub and Google sign-up/sign-in work for any verified provider account.
- Unverified provider emails cannot create accounts.
- The production branch has the demo account, a free profile, system item
  types, and no demo items.
- The demo credentials are visible on both auth pages.
- `/privacy` is reachable and linked.
- The full seed cannot run in production by accident.
- All quality gates pass.

## Known limitations

- **Google publishing depends on the console.** If `devgnosis.vercel.app` is
  rejected as an authorized domain, Google stays in Testing and only listed
  test users can use it; fall back to GitHub + demo publicly.
- **The demo is shared and publicly writable.** Until a reset script exists,
  avoid adding write features that would let visitors corrupt the demo.
- **No email verification.** Email/password sign-up stays closed until a
  sending domain exists.
- **No password reset.** OAuth users recover through their provider; the demo
  password is fixed.
- **Sign-up is closed everywhere by default.** Local testing opts in with
  `AUTH_EMAIL_SIGN_UP_ENABLED="true"`.

## Follow-ups

- Implement `@context/features/email-verification-spec.md` when a domain is
  available.
- Add a `db:seed:production --reset` mode before the first write feature.
- Exclude the demo account from billing, AI, and uploads.
- Add password reset once email verification ships.
