# Email Verification Spec (Deferred)

## Overview

Add Better Auth email verification for email/password accounts: a signed link
sent by Resend, strict enforcement before a session is created, auto sign-in
after verification, and a resend flow. This is the long-term replacement for
the access gating in `@context/features/access-gating-demo-spec.md`.

**Status: deferred.** Blocked on a verified sending domain. The current
production policy is OAuth-only sign-up plus the shared demo account.

## Goals

- Prove ownership of an email address before an email/password account can
  sign in.
- Keep OAuth users unaffected (providers already verify their email).
- Let locked-out users request a new verification email safely.
- Auto sign in after a successful verification link.

## Decisions

- **Better Auth link flow**, not OTP or magic link.
- **Strict mode**: `requireEmailVerification: true` when the feature is on.
- **Auto sign-in after verification**: `autoSignInAfterVerification: true`.
- **Re-verify existing unverified accounts**; do not grandfather them.
  Already-verified accounts (OAuth users and the demo account) stay verified.
  Forcing *every* account back to unverified would be a separate data operation.
- **Resend** as the provider, with a plain HTML/text template initially.
- **Env-gated rollout**: `AUTH_REQUIRE_EMAIL_VERIFICATION`, so the code can
  deploy before the domain exists without locking anyone out.
- **Dev/preview fallback**: log the verification URL instead of sending when
  no API key is present.

## Blocker

Resend requires a verified sending domain. `onboarding@resend.dev` can only
send to the Resend account owner's email, and `devgnosis.vercel.app` cannot be
verified because Vercel owns its DNS. Until a custom domain is purchased and
verified, strict verification cannot be enabled in production: users would
never receive the link and would be locked out.

Interim policy (already in place): email/password sign-up is disabled; OAuth
and the demo account remain available.

## Risks this closes

- Account squatting: registering an email the user does not own.
- The real owner being permanently blocked from their own address.
- Unsafe email-based recovery: password reset links reaching a stranger
  because the account email was never proven.
- Orphaned accounts from typoed emails.
- Account enumeration through duplicate-sign-up messages (Better Auth returns
  a generic success once `requireEmailVerification` is on).

## Requirements (when unblocked)

### Environment

```dotenv
RESEND_API_KEY=""
EMAIL_FROM="DevGnosis <noreply@devgnosis.app>"
EMAIL_REPLY_TO="" # optional
AUTH_REQUIRE_EMAIL_VERIFICATION="false"
```

- `RESEND_API_KEY` and `EMAIL_FROM` are required in production once the
  feature is enabled.
- `BETTER_AUTH_URL` must be required in production; verification links are
  built from it.
- `AUTH_REQUIRE_EMAIL_VERIFICATION` defaults to `false`; flip it to `true` only
  after the domain is verified.

### Better Auth

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: env.AUTH_REQUIRE_EMAIL_VERIFICATION,
  disableSignUp: !env.AUTH_EMAIL_SIGN_UP_ENABLED,
},
emailVerification: {
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60,
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: "Verify your DevGnosis email",
      html: renderVerificationEmail({ url, name: user.name }),
      text: renderVerificationEmailText({ url, name: user.name }),
    });
  },
},
```

- `sendOnSignIn` only fires after the password is verified, so it is not an
  email-spam vector by itself. Rate-limit the explicit resend action anyway.
- Better Auth swallows send errors via `runInBackgroundOrAwait`, so sign-up can
  succeed with no email. The resend flow is mandatory.

### Email transport

- `src/lib/email/send.ts`: `sendEmail({ to, subject, html, text })` using the
  Resend REST API via `fetch` (no SMTP).
- `src/lib/email/templates/verify-email.ts`: subject, HTML, and text builders.
  Escape the user name; never interpolate raw HTML.
- No key / non-production: log the verification URL and return success.
- Production without a key: throw.

### Flows and UI

- `signUpAction`: with strict mode, `signUpEmail` returns no session. Redirect
  to `/verify-email?email=…`, not `/dashboard`.
- `signInAction`: map `EMAIL_NOT_VERIFIED` (`FORBIDDEN`) to a distinct message
  with a resend link instead of "Invalid email or password."
- `/verify-email`: "Check your inbox", resend with a 60-second cooldown, and
  error states from `?error=TOKEN_EXPIRED|INVALID_TOKEN|USER_NOT_FOUND`.
- Resend action: `auth.api.sendVerificationEmail`, reusing
  `src/lib/rate-limit.ts` (Better Auth's router limiter is bypassed by
  `auth.api.*`).
- `/sign-in` shows `?verified=1` after a successful link when auto sign-in is
  off; with auto sign-in on, the link lands on `/dashboard`.

### Duplicate sign-ups

With `requireEmailVerification: true`, Better Auth returns a generic success
for an existing email. The current `SIGN_UP_DUPLICATE_MESSAGE` and
`isDuplicateAccountError` path become unreachable. Accept the generic
"check your email" response (enumeration protection); do not add a pre-check.

### Demo account

- Stays `emailVerified: true`; no change.
- The production demo account is provisioned by `db:seed:production`.

### Data

- No schema change. The verification token is a signed JWT keyed by
  `BETTER_AUTH_SECRET`; the `verification` table is not used by this flow.
- Rotating `BETTER_AUTH_SECRET` invalidates all outstanding links.

## Manual setup

1. Buy and configure a domain (e.g. `devgnosis.app`).
2. Add it to Resend, publish the SPF/DKIM records, and verify it.
3. Set `EMAIL_FROM` to an address on that domain.
4. Add `RESEND_API_KEY` and the flag to Vercel Production only.
5. Send a test email to the Resend account owner before enabling strict mode.
6. Flip `AUTH_REQUIRE_EMAIL_VERIFICATION=true` and redeploy.
7. Verify the full flow on `https://devgnosis.vercel.app`.

## Implementation (when unblocked)

| File | Change |
| --- | --- |
| `src/lib/env.ts` | Add Resend and verification env vars; require `BETTER_AUTH_URL` in production. |
| `src/lib/auth.ts` | Add `emailVerification` and `requireEmailVerification`. |
| `src/lib/email/send.ts` | New Resend transport with dev fallback. |
| `src/lib/email/templates/verify-email.ts` | New template builders. |
| `src/actions/auth.ts` | Sign-up redirect, `EMAIL_NOT_VERIFIED` mapping, resend action. |
| `src/app/verify-email/page.tsx` | New page with resend and error states. |
| `src/components/auth/resend-verification-form.tsx` | New client form. |
| `src/app/sign-in/page.tsx` | Show the unverified message and resend path. |
| `.env.example` | Document the new variables. |
| `context/project-overview.md` | Remove the backlog entry once shipped. |

## Test plan

- Sender selects Resend when a key exists and logs the URL otherwise.
- Production without a key throws.
- `EMAIL_NOT_VERIFIED` maps to the resend message.
- Resend is rate-limited per IP + email.
- Template escapes the user name.
- Sign-up under strict mode creates no session and redirects to `/verify-email`.
- The verification link signs the user in and lands on `/dashboard`.
- Expired and invalid tokens show the correct error state.
- Existing sign-up tests are updated for the generic duplicate response.

## Acceptance checks

- Unverified email/password users cannot sign in.
- A valid link verifies the account and signs the user in.
- Resend works and is rate-limited.
- OAuth users are unaffected.
- The demo account stays verified.
- No schema migration is required.
- All quality gates pass.

## Non-goals

- Disposable-email blocking (follow-up).
- Password reset (separate feature; requires the same transport).
- Email change flow (Better Auth supports it, but it needs verification too).
- Multi-device session management.

## Open questions

1. Which domain (`devgnosis.app`, `devgnosis.dev`, or another)?
2. Token lifetime: 1 hour (default) or shorter?
3. Should the resend button be available from `/sign-in` for locked-out users,
   or only from `/verify-email`?
4. Add a disposable-domain blocklist at the same time?
