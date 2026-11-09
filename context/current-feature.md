# Current Feature

<!-- Feature name and short description -->

**Access gating & production demo account** — disable email/password sign-up in
production, keep GitHub/Google OAuth open, reject unverified OAuth emails,
provision a demo account (no demo items) in the production branch, and add a
privacy page so the Google OAuth app can be published.

Spec: `@context/features/access-gating-demo-spec.md`.

## Status

<!-- Not Started | In Progress | Completed -->
In Progress — spec written; implementation awaiting approval.

## Goals

- Production accepts only OAuth (GitHub/Google) and the demo account; no
  email/password sign-ups.
- OAuth accounts with an unverified provider email are rejected.
- The demo account (`demo@devgnosis.app` / `password123`) exists in the
  production branch with a free profile, system item types, and no demo items.
- Demo credentials are visible on `/sign-in` and `/sign-up`.
- `/privacy` exists and is linked, so Google OAuth can leave Testing mode.
- The full development seed cannot run against production by accident.

## Notes

- Email verification is deferred until a sending domain exists; see
  `@context/features/email-verification-spec.md`.
- The demo account is shared and publicly writable. Exclude it from billing,
  AI, and uploads, and add a reset script before the first write feature ships.
- Preview keeps the same sign-up policy as production; test email/password
  sign-up locally, where `AUTH_EMAIL_SIGN_UP_ENABLED` defaults to true.
- Planned branch: `feature/auth-access-gating-demo`.

## History

Archived in `context/feature-history.md`. Append new entries there from `/feature/complete`; never rewrite them.
