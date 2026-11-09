# Current Feature

<!-- Feature name and short description -->

**Auth UI — Profile, Avatar & Account Menu** — finish the instructor's auth brief on top of the existing Better Auth sign-in/sign-up: a provider-image or initials avatar, a sidebar account menu with Profile and Sign out, and a real `/profile` page.

## Status

<!-- Not Started | In Progress | Completed -->
In Progress

## Goals

<!-- Goals and requirements -->

- Add a reusable `UserAvatar` that uses `user.image` when present and generated initials otherwise (`"Brad Traversy"` → `"BT"`).
- Replace the sidebar's inline avatar and sign-out button with an account block: clicking the avatar/name opens a Radix dropdown with **Profile** and **Sign out**.
- Add a real authenticated `/profile` page with read-only name, email, plan, and join date.
- Keep Better Auth, the `/sign-up` route, and auto-login to `/dashboard` after registration.
- No schema change or new dependency; lint, typegen + type-check, tests, and build pass.

## Notes

<!-- Additional notes or comments -->

- Spec: `@context/features/auth-ui-spec.md`.
- Branch: `feature/auth-ui-profile-avatar-account-menu`.
- The instructor's NextAuth-specific `/register` and `/api/auth/register` are intentionally not adopted; `/sign-up` and `signUpAction` are the project equivalents.
- The brief's "dropdown on avatar click" and "avatar click goes to /profile" conflict. Resolution: clicking the avatar/name area opens the account menu; **Profile** inside it navigates to `/profile`.
- `/profile` is standalone in this slice; sharing the dashboard shell is a follow-up.
- The brief's testing note says "top bar"; the requirements say sidebar, so the sidebar is authoritative.

## History

Archived in `context/feature-history.md`. Append new entries there from `/feature/complete`; never rewrite them.
