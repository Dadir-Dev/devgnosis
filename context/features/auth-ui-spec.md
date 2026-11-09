# Auth UI — Profile, Avatar & Account Menu Spec

## Overview

Customise the existing Better Auth auth UI to match the instructor's auth brief. The
sign-in and registration pages are already implemented; this feature finishes the
identity side of the brief:

- A real `/profile` page.
- A reusable avatar that shows a provider image or generated initials.
- An account menu in the bottom of the sidebar with **Profile** and **Sign out**.

The project keeps **Better Auth**, **Server Actions**, and the existing `/sign-up`
route. It does **not** switch to NextAuth. Registration keeps its current
**auto-login** behaviour and lands on `/dashboard` instead of `/sign-in`.

## Status

Not Started.

**Planned branch:** `feature/auth-ui-profile`.

## Goals

- Avatar shows `user.image` when present; otherwise it shows generated initials.
- Initials match the brief's example: `"Brad Traversy"` → `"BT"`.
- The bottom-of-sidebar identity block shows the avatar, name, and email.
- Clicking the avatar area opens the account menu.
- The account menu contains **Profile** (navigates to `/profile`) and **Sign out**.
- `/profile` is a real authenticated route with read-only account details.
- Existing sign-in, sign-up, OAuth, rate limiting, and sign-out behaviour is unchanged.

## Non-goals

- Switching from Better Auth to NextAuth.
- Renaming `/sign-up` to `/register`, or adding `/api/auth/register`. Better Auth's
  built-in equivalent is `/api/auth/sign-up/email`, which the catch-all handler already
  serves; the UI intentionally uses a Server Action.
- Redirecting to `/sign-in` after registration. Auto-login to `/dashboard` stays.
- Editing the profile (name, email, password, avatar upload).
- Email verification, password reset, account linking, or account deletion.
- A `/settings` page or billing UI.
- Account-menu work in the top bar. The brief's requirements put the avatar in the
  sidebar; the testing note that says "top bar" is treated as a typo.
- Displaying which OAuth providers are linked.
- Reusing the dashboard shell on `/profile` (recorded as a follow-up).

## Brief coverage

| Instructor requirement | Status in this project |
| --- | --- |
| `/sign-in` with email/password | Already implemented; verify only |
| "Sign in with GitHub" button | Already implemented (GitHub + Google, conditional on env) |
| Link to register | Already implemented, points to `/sign-up` |
| Form validation and errors | Already implemented (Zod + HTML constraints + `aria-*`) |
| `/register` with name, email, password, confirm | Already implemented at `/sign-up` |
| Passwords match / email format | Already implemented in `signUpSchema` |
| Submit to `/api/auth/register` | Not applicable; Server Action calls `auth.api.signUpEmail` |
| Redirect to sign-in on success | Intentionally differs: auto-login to `/dashboard` |
| Avatar: image or initials | **This feature** |
| Sidebar name + email | Already implemented; keep |
| Dropdown with "Sign out" | **This feature** |
| Avatar click → account menu → `/profile` | **This feature** |
| Reusable avatar component | **This feature** |

## Requirements

### 1. Initials helper

Add `src/features/auth/initials.ts` as a pure, testable helper:

```ts
export function getInitials(value: string): string;
```

Rules:

1. Trim the value and split on whitespace; ignore empty segments.
2. No segments → return `""`.
3. One segment → return its first character, uppercased.
4. Two or more segments → return the first character of the first segment plus the
   first character of the last segment, uppercased.
5. Take characters by code point (`Array.from` / spread), not `charAt`, so a
   surrogate pair is never split.
6. Return at most two characters.

Examples:

| Input | Output |
| --- | --- |
| `"Brad Traversy"` | `"BT"` |
| `"brad"` | `"B"` |
| `"  Brad   Traversy  "` | `"BT"` |
| `"Brad van Traversy"` | `"BT"` |
| `""` / whitespace | `""` |
| `"demo@devgnosis.app"` | `"D"` |

### 2. Reusable avatar component

Add `src/components/auth/user-avatar.tsx`.

It is a client component because it needs an `onError` fallback for broken remote
images.

```ts
type UserAvatarProps = {
  name: string;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When false, the image gets `alt={name}`. Defaults to true. */
  decorative?: boolean;
};
```

Behaviour:

1. Render the provider image when `image` is a non-empty `http(s)` URL.
2. If the image fails to load, fall back to initials without a page error.
3. If `image` changes, reset the failed state so the new URL is attempted.
4. Initials resolution: `getInitials(name)`, then `getInitials(email ?? "")`, then
   `"?"`.
5. Sizes: `sm` = 32px (`size-8`), `md` = 40px (`size-10`), `lg` = 64px (`size-16`).
6. Always `rounded-full`, `shrink-0`, centred, and `select-none`.
7. Use `<img>` rather than `next/image`: provider avatar hosts are arbitrary remote
   URLs and are not part of a configured image allowlist. Add a targeted
   `eslint-disable-next-line @next/next/no-img-element` with a short comment.
8. Image attributes: `referrerPolicy="no-referrer"`, `loading="lazy"`,
   `decoding="async"`, and `alt` per `decorative`.
9. The initials fallback uses the same size/shape and a muted background. The caller
   supplies the colour classes through `className` where the sidebar needs its own
   tokens.

### 3. Sidebar identity block

Update `dashboard/layout.tsx` to pass `user.image` through:

```ts
<Sidebar
  user={{ name: user.name, email: user.email, image: user.image ?? null }}
  ...
/>
```

Add a serializable type in `src/features/dashboard/sidebar.ts`:

```ts
export type SidebarUser = {
  name: string;
  email: string;
  image: string | null;
};
```

Update `SidebarDataProps.user` to `SidebarUser`.

Add `src/components/auth/user-menu.tsx` (client) and replace the current inline avatar
span plus `SignOutButton` in `src/components/dashboard/sidebar.tsx`.

**Expanded sidebar and mobile drawer:**

- Avatar + name + email form the Radix `DropdownMenu.Trigger`, rendered as a button
  with the sidebar's account-block styling.
- The menu opens to the end/bottom and contains:
  - a non-interactive label with the user's name and email;
  - **Profile** → `/profile`;
  - **Sign out** → submits `signOutAction`.
- The menu item styling matches existing sidebar/menu tokens and has a visible focus
  state.

**Collapsed sidebar:**

- The avatar is the `DropdownMenu.Trigger` with a `title` and
  `aria-label="Open account menu"`.
- The name and email remain available to screen readers through `sr-only` text.

**Sign out:**

- Reuse `signOutAction` from `src/actions/auth.ts`.
- Keep the pending state on the menu item (for example with `useFormStatus`).
- Do not add a browser-side auth SDK.
- `src/components/auth/sign-out-button.tsx` becomes unused once the menu lands;
  remove it in this feature or leave it only if another caller appears.

Use `radix-ui`'s `DropdownMenu` (`import { DropdownMenu } from "radix-ui"`). No new
dependency is required.

### 4. Profile page

Add `src/app/profile/page.tsx` as a Server Component:

1. Call `requireUser()`; signed-out visitors are redirected to `/sign-in`.
2. Read the effective plan with `getUserPlan(user.id)`.
3. Render a standalone authenticated page (the dashboard shell is not reused in this
   slice):
   - a small header with the DevGnosis mark linking to `/dashboard`;
   - a "Back to dashboard" link;
   - a card containing a large `UserAvatar`, the user's name, email, plan badge
     (`Free` / `Pro`), and "Member since <date>";
   - a note that profile editing is not available yet.
4. Format the join date on the server with a fixed locale and time zone, e.g.
   `Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" })`, so server
   and client output cannot disagree.
5. Export `const metadata` with `title: "Profile · DevGnosis"`.
6. Export `export const instant = false;` because the page reads the session and
   cannot produce a static shell.
7. Add `src/app/profile/loading.tsx` with a small skeleton that matches the card layout.
8. Do not add editing controls, forms, or mutations.

### 5. Auth pages (verify only)

No code changes are expected on `/sign-in` or `/sign-up`. Confirm in the manual test
pass that:

- `/sign-in` renders email/password, the configured GitHub/Google buttons, and the
  `/sign-up` link.
- `/sign-up` renders name/email/password/confirm-password with field-level errors and
  redirects to `/dashboard` after success (auto-login).
- A signed-in browser visiting either page is redirected to `/dashboard`.
- Sign out clears the session and returns to `/sign-in`.

## Decisions

- **Keep Better Auth.** The brief's NextAuth references are conventions, not a
  requirement to change libraries. Switching would throw away working actions, schema,
  rate limiting, and tests.
- **Keep `/sign-up`.** It is already wired into OAuth error handling and
  `requireGuest()`.
- **Keep auto-login after registration.** `signUpEmail` creates the session and
  `nextCookies()` persists it; the action redirects to `/dashboard`. This intentionally
  differs from the brief's "redirect to sign-in".
- **Real `/profile` route.** A top-level page, guarded by `requireUser()`.
- **Avatar opens the account menu.** The brief says both "dropdown on avatar click"
  and "clicking the icon should go to /profile"; these conflict. The chosen behaviour
  is the dropdown: clicking the avatar/name block opens the account menu, and
  **Profile** inside it navigates to `/profile`. There is no separate chevron trigger.
- **Radix `DropdownMenu`.** `radix-ui` is already installed and used by the sidebar
  dialog.
- **Plain `<img>` for provider avatars.** It avoids coupling the build to specific
  provider hostnames and lets the component fall back cleanly with `onError`.
- **Standalone profile page.** Reusing the dashboard sidebar/top bar requires an
  authenticated route group or a duplicated shell; that is deferred so this feature
  stays small.
- **No database migration.** `user.image`, `user.name`, `user.email`,
  `user.createdAt`, and `user_profiles.plan` already exist.

## Implementation

| File | Change |
| --- | --- |
| `src/features/auth/initials.ts` | New pure `getInitials()` helper. |
| `src/features/auth/initials.test.ts` | New unit tests for the helper's edge cases. |
| `src/components/auth/user-avatar.tsx` | New client avatar with image + initials fallback. |
| `src/components/auth/user-menu.tsx` | New client sidebar account block and Radix dropdown. |
| `src/components/auth/sign-out-button.tsx` | Remove once the user menu replaces its only caller. |
| `src/features/dashboard/sidebar.ts` | Add the `SidebarUser` view model. |
| `src/components/dashboard/sidebar.tsx` | Render `UserMenu`; pass through `image`; drop the inline avatar/sign-out button. |
| `src/app/dashboard/layout.tsx` | Pass `user.image` to the sidebar. |
| `src/app/profile/page.tsx` | New authenticated read-only profile page. |
| `src/app/profile/loading.tsx` | New skeleton for the profile card. |
| `context/current-feature.md` | Point the live feature at this spec, then complete it. |
| `context/feature-history.md` | Append the completion entry via `/feature/complete`. |

## Test plan

### Unit (Vitest)

`src/features/auth/initials.test.ts`:

- `"Brad Traversy"` → `"BT"`.
- One-word, lower-case, extra-whitespace, and multi-word inputs.
- Empty/whitespace input → `""`.
- An email-like single token → its first letter.
- A non-ASCII first letter is preserved and uppercased.
- Output never exceeds two characters.

No component test harness exists yet; avatar and menu behaviour is verified manually.

### Manual

- [ ] Sign in with the demo account and open `/dashboard`.
- [ ] Sidebar shows name, email, and an initials avatar (the demo user has no image).
- [ ] Sign in with GitHub and verify the GitHub avatar appears.
- [ ] Break the image URL temporarily and verify the initials fallback appears without
      an error page.
- [ ] Click the avatar/name area to open the account menu, then use **Profile** to
      reach `/profile`.
- [ ] `/profile` shows the large avatar, name, email, plan badge, and join date.
- [ ] Open the account menu and confirm **Profile** and **Sign out**.
- [ ] Activate **Sign out** and confirm the session clears and `/sign-in` renders.
- [ ] Collapse the sidebar and confirm the avatar still opens the menu.
- [ ] Open the mobile drawer and repeat the avatar/menu checks.
- [ ] Keyboard: Tab to the avatar trigger, open the menu with Enter/Space, arrow
      between items, and activate Sign out.
- [ ] Signed-out `/profile` redirects to `/sign-in`.
- [ ] `/sign-in` and `/sign-up` still render and link to each other.
- [ ] Register a new account and confirm it lands on `/dashboard` (auto-login).
- [ ] `bun run gate` passes (lint, typegen + type-check, tests, production build).

## Acceptance checks

- `getInitials("Brad Traversy") === "BT"`.
- The sidebar uses `user.image` when present and initials otherwise.
- The sidebar still displays name and email in the expanded state.
- Clicking the avatar/name area opens the account menu; **Profile** navigates to
  `/profile`.
- The account menu contains **Profile** and **Sign out**.
- Sign out uses the existing Server Action and redirects to `/sign-in`.
- `/profile` is reachable only with a session and renders read-only account details.
- No new dependency is added.
- No database migration is required.
- All quality gates pass.

## Known limitations

- **Profile page is outside the dashboard shell.** Navigating from the sidebar to
  `/profile` replaces the shell with a standalone page. Moving both routes into a
  shared authenticated route group is a follow-up.
- **The avatar menu and the "go to profile" instruction conflict in the brief.** The
  avatar opens the account menu, with **Profile** inside it, as described in
  Decisions.
- **No profile editing.** The page is read-only.
- **Provider avatar hosts are not allowlisted for `next/image`.** Plain `<img>` is used
  deliberately.
- **The brief's `/register` and `/api/auth/register` names are not implemented.**
  `/sign-up` and the Server Action are the project's equivalents.
- **The brief's testing note says "top bar"; the requirements say sidebar.** The
  sidebar is authoritative.

## Follow-ups

- Move `/dashboard` and `/profile` into an authenticated route group with one shared
  shell, so the sidebar stays visible on the profile page.
- Add profile editing (display name, avatar) when the settings feature is designed.
- Add a `/register` → `/sign-up` redirect only if an external requirement insists on
  the exact URL.
- Add component tests once a client component test harness exists.
