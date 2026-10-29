# Current Feature

<!-- Feature name and short description -->

**Auth Rate Limiter (H1)** — Throttle the in-process Better Auth sign-in and sign-up Server Actions, which bypass the HTTP-router rate limiter entirely.

## Status

<!-- Not Started | In Progress | Completed -->
Not Started

## Goals

<!-- Goals and requirements -->

Draft goals — confirm before starting.

- Add `src/lib/rate-limit.ts` exposing `consumeAuthAttempt(key)`, keyed by IP + email.
- Call it before delegating to Better Auth in both `signInAction` and `signUpAction`, and return a neutral "too many attempts" state.
- When a shared store exists, set `rateLimit.storage` in `src/lib/auth.ts` so the HTTP route is effective across instances too.

## Notes

<!-- Additional notes or comments -->

Source: inline request resolved from `SCAN-FINDINGS.md` → High → **H1 — The only auth path bypasses the only rate limiter in the stack** (`SCAN-FINDINGS.md:50-66`). No spec file exists for this feature yet.

Open decisions from the finding:
- Better Auth's default in-memory limiter storage is per-instance on serverless, so the limiter is weak on either route; choosing/adding a shared store is undecided.
- `consumeAuthAttempt` must be keyed by IP + email — the key derivation (how the client IP is obtained behind the host) is not settled.
- This finding also states the project rule it violates: `context/project-overview.md:205` requires auth endpoints to be rate-limited.

## History

<!-- Keep a record of changes and updates. Earliest to latest -->

**Initial Setup**
Next.js 16, Tailwind CSS, TypeScript configuration(Completed).

**Dashboard UI — Phase 1**
Completed on branch `feat/dashboard-phase-1`: initialized ShadCN UI (Button, Input), added the `/dashboard` route with a dashboard layout, dark mode by default, a display-only top bar (search + New item), and Sidebar/Main placeholders. Lint, type-check, and production build pass. Status: Completed.

**Dashboard UI — Phase 2**
Completed on branch `feat/dashboard-phase-2`: replaced the sidebar placeholder with a collapsible desktop rail driven by a `SidebarProvider` client context, added item-type links to `/items/TYPE` (with type icons/colors and PRO badges), favorite and most-recent collection sections, a user avatar area at the bottom, a top-bar drawer trigger, and a Radix Dialog drawer that is always used on mobile. Seeded two favorite collections in the mock data so the favorites section renders. Lint, type-check, and production build pass. Status: Completed.

**Dashboard UI — Phase 3**
Completed on branch `feature/dashboard-phase-3`: built out the dashboard main area with a greeting header, four summary stat cards (items, collections, favorite items, favorite collections), pinned item cards, color-tinted recent collection cards, and the ten most recent items. Extracted a shared item-type icon map, streamed request-time relative timestamps behind a Suspense boundary, and themed app-wide scrollbars. Lint, type-check, and production build pass. Status: Completed.

**Database Foundation — Neon PostgreSQL + Drizzle ORM**
Completed on branch `feature/neon-drizzle`: set up Drizzle ORM against Neon PostgreSQL (stable v0 line — `drizzle-orm@0.45.4` / `drizzle-kit@0.31.11`) with the Neon serverless driver, Better Auth + Drizzle adapter, `ws`, and Zod. Added Zod-validated server-only env (`src/lib/env.ts`), `drizzle.config.ts`, the pooled `neon-serverless` client (`src/db/index.ts`, `server-only`), the full `src/db/schema/*` (CLI-generated Better Auth tables, application tables, relations, and barrel), an idempotent `src/db/seed.ts` for the seven system item types, the reviewed initial migration `0000_youthful_blockbuster.sql`, and the `db:generate` / `db:migrate` / `db:check` / `db:studio` / `db:seed` / `db:smoke` / `auth:generate` scripts. Recorded the Drizzle stable-line and `user_profiles`-vs-`additionalFields` decisions in `@context/project-overview.md` and `@context/features/database-spec.md`. Added a guarded, self-cleaning smoke test (`db:smoke`) that doubles as a CI post-`db:migrate` gate. Verified: migration applied to a fresh Neon development branch, seed idempotent, `db:check` clean, 10/10 smoke checks passing, and lint / type-check / production build green. Status: Completed.

**Seed Data — Demo User, Collections & Items**
Completed on branch `feature/seed-data`: expanded `src/db/seed.ts` from the seven system item types into a full development/demo seed per `@context/features/seed-spec.md`. The demo account (`demo@devgnosis.app` / `12345678`) is created through `auth.api.signUpEmail` (Better Auth owns hashing) and `emailVerified` is set true so it can sign in immediately; its `user_profiles` row upserts to the `free` plan. Added five collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) with three TypeScript snippets, three prompts, two commands, and four links (real URLs), plus the item↔collection joins. Idempotency uses deterministic SHA-256-derived UUIDs for items, an upsert on the `(owner_id, slug)` collection index, and `ON CONFLICT DO NOTHING` joins, all inside one transaction. Also raised the free plan's collection limit from 3 to 5 in `@context/project-overview.md` so the seeded demo account matches its entitlements. Verified against the Neon development branch: two consecutive `bun run db:seed` runs leave exactly 1 user, 1 profile, 5 collections, 18 items, and 18 joins, with lint / type-check / production build green. Status: Completed.

**Seed Favorites & Pins** (commit `3eccb94`)
Seeded two favorite collections (AI Workflows, DevOps), three favorite items, and two pinned items so the dashboard's Pinned and Favorites sections have data. Carried over from the dashboard read-path spike before that branch was dropped.
**Follow-up (deferred):** re-seeding never prunes rows removed from the `COLLECTIONS` definition, so retired seed rows linger. Reset the demo account (delete its collections/items, then re-insert) once the write path exists and the ownership model for seeded-vs-user rows is settled. Tracked here because the seed feature's own notes were archived.

**Dashboard Collections — real database data**
Completed on branch `feature/dashboard-collections` (merged to `main`): replaced the mock "Recent collections" grid with owner-scoped reads from Neon via Drizzle. Added `src/db/queries/collections.ts` (`server-only`; `getRecentCollections` + `getDashboardCounts`, two set-based owner-scoped queries), pure summary rules in `src/features/collections/summary.ts` (dominant type with a system-order tie-break, summed `itemCount`, neutral `#6B7280` fallback), a minimal Better Auth sign-in flow (`src/lib/auth-session.ts`, `/sign-in`, a Zod-validated Server Action, `nextCookies()`, `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`), prop-driven `RecentCollections`/`StatsCards` fed by the async dashboard server component, an empty-collections panel, `loading.tsx` + skeleton, `error.tsx`, and Vitest (`bun run test`, 14 tests: owner scoping on all four queries, dominant-type ordering/tie-break/custom keys, count summation, empty/foreign rows). Also moved canonical type keys into `src/lib/system-item-types.ts` so server code no longer imports `lucide-react`/`react`, made `ItemTypeIcon` accept `{ key, color }` with a `Shapes` fallback, reconciled the snippet icon as `CodeXml`, and made `updatedAt DESC` ordering deterministic with `name`/`id` tie-breaks (the seed writes all collections in one transaction). Verified against the Neon dev branch: demo sign-in returns a session cookie, `/dashboard` renders 18 items / 5 collections with the expected four cards and dominant tints, a random other user id returns 0/0, and a fresh no-collection user renders the empty state. Lint, type-check, tests (14/14), and production build pass. Status: Completed.

**Follow-ups discovered during the dashboard collections work (not scheduled):**
- **Resolved:** the last `mock-data` dependency (sidebar + greeting) was retired in the Stats & Sidebar feature, and `src/lib/mock-data.ts` is deleted.
- `/collections` and `/collections/[slug]` do not exist yet, so the "View all" link and every collection card currently navigate to a 404.
- No `/api/auth/[...all]` Route Handler is mounted; the Server Action calls Better Auth directly. Add the handler if a Better Auth client or OAuth is introduced.
- There is no sign-out anywhere, and the seeded demo password is shown on `/sign-in` outside production.
- `collections.updatedAt` only changes when the collection row is written — adding an item does not bump it. Revisit `createdAt` or `max(item_collections.addedAt)` if "recent" looks wrong with real data.
- `bun run db:seed` still does not prune retired seed rows (see the Seed Favorites & Pins note above).

**Dashboard Items — real database data**
Completed on branch `feature/dashboard-items`, per `@context/features/dashboard-items-spec.md`: replaced the mock pinned items, recent items, and item-related stats with owner-scoped Neon/Drizzle reads. Added `src/db/queries/items.ts` (`server-only`; `getPinnedItems` / `getRecentItems`, joined `item_types`, one batched owner-scoped tag query ordered by `normalizedName`, `updatedAt DESC` with an `id ASC` tie-break), the `DashboardItem` / `ItemTypeView` view model and pure `buildDashboardItems` in `src/features/items/dashboard-items.ts`, prop-driven `PinnedItems` / `RecentItems` (type-tinted pinned cards, URL/file preview fallbacks, hidden empty pinned section, designed recent-items empty panel), database-backed `DashboardCounts` (items, collections, favorite items, favorite collections, rolling-7-day `addedThisWeek`) in `src/db/queries/collections.ts` + `src/features/collections/summary.ts`, a fully prop-driven `StatsCards`, and optional seeded `tags` for every demo item (24 unique tags / 47 item-tag joins; re-running `bun run db:seed` leaves the counts unchanged). Removed `getItemTypeById()` and its mock imports from `src/lib/item-types.ts`; the sidebar and greeting still read `mock-data` by design. Vitest: 29 tests passing, including owner scoping, pinned filtering/limit, ordering/tie-break, batched tags, favorite counts, the rolling-7-day boundary, and empty view models. Lint, typegen + type-check, and production build pass. Status: Completed.

**Stats & Sidebar — real database data**
Completed on branch `feature/stats-sidebar-data`, per `@context/features/stats-sidebar-spec.md`: retired the last `src/lib/mock-data.ts` imports from the dashboard. The main-area stats were already database-backed; this feature wired the sidebar. Added `systemItemTypeCountsQuery` + `getSidebarItemTypes` to `src/db/queries/items.ts` (system types LEFT JOINed to owner-scoped item counts so zero-count types remain), `sidebarCollectionsQuery` + `getSidebarCollections` + `getFavoriteItemCount` to `src/db/queries/collections.ts` (all favorites plus four most recent non-favorites, reusing `collectionTypeBreakdownQuery`/`buildCollectionSummaries` for dominant-type colors), `userPlanQuery` + `getUserPlan` in `src/db/queries/profiles.ts`, and `src/lib/plans.ts` for fail-closed effective-plan normalization (`pro` + `active`/`trialing` only). New `src/features/dashboard/sidebar.ts` holds the serializable view models and pure `buildSidebarItemTypes` / `buildSidebarCollections` / `formatTypeLabel` helpers. `src/app/dashboard/layout.tsx` now resolves the session and loads sidebar data on the server; `src/components/dashboard/sidebar.tsx` is fully prop-driven with live type counts, plan-aware PRO badges (free users only), star favorites, dominant-type dots for recents, a "View all collections" link, and the real user identity. Replaced the mock greeting with a local `DASHBOARD_GREETING` constant. Added `export const instant = false` to the dashboard layout because the authenticated shell reads the session/sidebar data on every request and cannot produce a static shell; `loading.tsx` still streams the main content. Verified against the Neon development branch: demo user shows 18 items / 5 collections / 3 favorite items / 2 favorite collections, type counts 4/3/0/5/6 with File/Image PRO for free, and toggling the demo profile to `pro` replaces both PRO badges with counts (then reverted to `free`). Vitest: 45 tests passing (added owner-scoped plan and type-count query tests, plan normalization, label/order/plan-lock and favorites/recents/dot builders). Lint, typegen + type-check, and production build pass. Status: Completed.

**Pinned Items — syntax highlighting** (fix/pinned-syntax-highlighting)
The pinned cards rendered snippet/command content as plain monospace text; no highlighter was ever wired up. Added a reusable `src/components/dashboard/code-block.tsx` (server-only) that highlights with a fine-grained Shiki bundle (`shiki/core` + pure-JS regex engine, so no WASM): One Dark Pro / One Light dual themes emitted as `--shiki-*` CSS variables and resolved by the new `.code-highlight` rules in `src/app/globals.css`. `PinnedItems` now renders code through `CodeBlock`, keyed on the item's stored `language`. The language mapping lives in pure, tested `src/features/items/code-language.ts` (`CODE_LANGUAGES` + `resolveCodeLanguage`): canonical grammars typescript/tsx/jsx/javascript, bash, dockerfile, json/yaml/css/html/sql/python/go/rust/markdown, aliases (`ts`, `js`, `react`/`reactjs`→tsx, `node`/`mjs`/`cjs`→javascript, `sh`/`shell`/`zsh`→bash, `docker`→dockerfile, `htm`, `yml`, `md`/`mdx`, `py`, `golang`), case/whitespace normalization, and a plain-`text` fallback for unknown values. `code-language.test.ts` locks the alias/normalization/fallback behavior; Vitest is 49/49. Prompt/Note prose, links, and files are unchanged. Lint, typegen + type-check, and production build pass. Status: Completed.

**Sign-up & OAuth Providers — Email, GitHub & Google**
Completed on branch `feature/auth-signup-oauth`, per `@context/features/oauth-providers-spec.md`: added a dedicated `/sign-up` route with email/password registration and shared GitHub/Google buttons on both auth pages. Added paired optional OAuth env validation (`src/lib/env.ts`; a half-configured pair fails startup, blank values count as absent), conditional `socialProviders` plus `account.encryptOAuthTokens` in `src/lib/auth.ts`, the Better Auth route handler at `src/app/api/auth/[...all]/route.ts`, `signInWithProviderAction`/`signUpAction` with Zod schemas in `src/features/auth/schemas.ts`, pure provider resolution in `src/features/auth/oauth-providers.ts`, inline brand SVGs, the sign-up form, and the `/sign-in` ↔ `/sign-up` links. Both pages stay Server Components and pass only `OAuthProvider[]`; no OAuth UI renders when credentials are absent, and `?error=oauth` messages are shown even when Better Auth appends its own `error` code. Added `export const instant = false` to both auth pages because they read `searchParams` and cannot produce a static shell. Vitest: 79 tests passing (provider resolution, env pair validation, form/OAuth schemas, action error mapping). Lint, typegen + type-check, production build, and runtime smoke tests with and without OAuth credentials pass. Status: Completed.

**Follow-up on the same branch — session UX and environments:** added `signOutAction` plus a sidebar sign-out control, because the app previously had no way to end a session from the UI. `/sign-in` and `/sign-up` now call `requireGuest()` so a signed-in browser is redirected to `/dashboard` instead of seeing an unusable form. Verified: signed-out `/dashboard` → 307 `/sign-in`; signed-in `/sign-in` and `/sign-up` → 307 `/dashboard`; sign-out clears the Better Auth cookies and `/dashboard` redirects again. Deployment: each environment now has its own Neon branch (`development`, `preview`, `production`) and its own Vercel scope; see `@context/project-overview.md` → Architecture → Environments. Still open before public sign-ups: the Google OAuth app is in Testing mode, so only added test users can sign in until it is published.

