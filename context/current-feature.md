# Current Feature

**Dashboard Collections — real database data**

Replace the dummy collection data in the dashboard main area with real, owner-scoped data from
Neon PostgreSQL via Drizzle ORM. Full spec: `@context/features/dashboard-collections-spec.md`.

## Status

Completed

## Scope

**In scope**

- The "Recent collections" grid in `@src/components/dashboard/recent-collections.tsx` and the
  item-type data it renders (icons + dominant color).
- The Items/Collections totals in the dashboard header and the first two stat cards.
- A minimal `/sign-in` flow so the authenticated read is reachable.

**Out of scope**

- The pinned items, recent items, and sidebar sections — they keep reading
  `@src/lib/mock-data.ts` for now.
- The collection detail pages (`/collections`, `/collections/[slug]`) and the items list inside
  a collection.
- Favorite counts, `addedThisWeek`, and auth polish (sign-out, OAuth, password reset, styling).

## Goals

- Add `src/db/queries/collections.ts` (imports `"server-only"`) with owner-scoped read functions:
  - `getRecentCollections(userId, limit = 4)` returning a serializable view model with `id`,
    `slug`, `name`, `description`, `itemCount`, and `types` (distinct item types present, each
    with `id`, `key`, `name`, `color`, `icon`, `count`).
  - A small `getDashboardCounts(userId)` doing `count(*)` over `items` and `collections`.
  - Set-based grouped join (`item_collections → items → item_types`), not N+1.
  - Derive shapes from `src/db/schema` (`typeof collections.$inferSelect` where useful); no
    duplicate hand-maintained table shapes.
- Dominant ("most-used") content type per collection = highest item count; tie-break by system
  type order (`snippet`, `prompt`, `note`, `command`, `link`, `file`, `image`) for a stable
  color. Collections with no items fall back to neutral tint `#6B7280` and show no type icons.
- Add a server-only session helper (`src/lib/auth-session.ts`, `getCurrentUser()` /
  `getSession()`) backed by Better Auth (`auth.api.getSession({ headers: await headers() })`).
  Redirect to `/sign-in` when there is no session — never fall back to another user's or
  unscoped data. Never accept a `userId` from the client.
- Add a minimal `/sign-in` page (`src/app/sign-in/page.tsx`): client form (email + password)
  submitting a Server Action that calls `auth.api.signInEmail({ body, headers })`, then
  `redirect("/dashboard")` on success; safe inline error on failure (no provider/stack details).
  Show the seeded demo credentials (`demo@devgnosis.app` / `12345678`) as a hint in
  non-production only.
- Fetch collections directly in `@src/app/dashboard/page.tsx` (server component) — no Route
  Handler self-fetch, no client fetch. Pass the list to the component as props.
- Render 4 recent collection cards from the DB, keeping the current design; card tint from the
  most-used content type; small icons for all types present; `itemCount` from the view model.
- Refactor item type resolution so DB-derived types work:
  - `ItemTypeIcon` accepts a minimal structural type (e.g. `{ key: string; color: string }` or a
    shared `ItemTypeView` exported from the query module).
  - Add a safe fallback icon for an unknown/omitted key.
  - Reconcile the cosmetic snippet icon mismatch (mock `Code2` vs `TYPE_ICONS` `CodeXml`).
  - Keep `ItemTypeIcon` a Server Component (no `'use client'`).
- Wire the Items/Collections totals into the dashboard header ("N items across M collections")
  and the first two stat cards via `getDashboardCounts`, passed down as props.
- Add empty/loading/error states:
  - Empty: meaningful empty state instead of an empty grid (keep heading and "View all" link).
  - Loading: `src/app/dashboard/loading.tsx` (or Suspense) skeleton matching the card grid.
  - Error: `src/app/dashboard/error.tsx` with a user-safe message.
- Add Vitest coverage for owner scoping (another user's collections never returned),
  dominant-type selection including the tie-break, and the empty-collections case. Mock the DB
  boundary, not the business rule.

## Notes

- Uses **Drizzle ORM**, not Prisma (the earlier Prisma wording in the spec was corrected).
- Card count is **4** (matches current layout and the screenshot), not 6.
- "Recent" = `collections.updatedAt DESC` (matches the existing
  `collections_owner_updated_idx` index). Caveat: `updatedAt` only changes when the collection
  row is written — adding an item does not bump it, and `db:seed` sets `updatedAt = now()` on
  every run, flattening the order after a re-seed. Revisit `createdAt` or
  `max(item_collections.addedAt)` only if real data looks wrong.
- Header label stays **"Recent collections"** (the code's current label; the screenshot's
  "Collections" is not adopted).
- **Caching:** `next.config.ts` sets `cacheComponents: true`, so fetching is dynamic by default.
  This is per-user, owner-scoped data and must not be cached globally. Do not wrap the query in
  `'use cache'`; any future caching must be keyed/tagged per user.
- **Mixed data is expected:** real collection cards, per-card counts, and Items/Collections
  totals, while the sidebar, pinned items, recent items, and the favorites/`addedThisWeek` stats
  still read `mock-data`. Do not remove `@src/lib/mock-data.ts` — it is still used by
  `sidebar.tsx`, `stats-cards.tsx`, `pinned-items.tsx`, and `recent-items.tsx`.
- Seeded collections (`React Patterns`, `AI Workflows`, `DevOps`, `Terminal Commands`, `Design
  Resources`) differ from the mock/screenshot names, so the real dashboard will not match the
  screenshot card-for-card. "Keep the current design" means layout/treatment, not exact cards.
- Deferred: items list under collections, `/collections` pages, favorite counts,
  `addedThisWeek`, and sign-out/OAuth/other auth polish.

## Acceptance Checks

- Signed out, visiting `/dashboard` redirects to `/sign-in`; signing in with the demo
  credentials lands on `/dashboard`.
- Signed in as the demo user, `/dashboard` renders 4 collection cards sourced from the database,
  and the header/stat-card Items and Collections totals match the DB.
- Card border/background tint reflects the most-used item type; the type-icon row matches the
  types actually present.
- No query returns data outside the resolved user's ownership.
- Empty/loading/error states render correctly.
- `bun run lint`, `bunx next typegen && bunx tsc --noEmit`, and `bun run build` pass.

## References

- `@context/features/dashboard-collections-spec.md` — full spec.
- `@context/screenshots/dashboard-ui-main.png` — layout reference.
- `@context/coding-standards.md` — project organization, ownership, RSC/data-read rules.
- `@context/project-overview.md` — item-type icons/colors, UX direction.
- `@context/features/database-spec.md` — Drizzle/Neon client, schema conventions.
- `@context/features/seed-spec.md` — demo user and seeded collections/items.
- `@src/db/schema/collections.ts`, `@src/db/schema/items.ts`, `@src/db/schema/item-types.ts`.

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
Started: synced `@context/current-feature.md` with `@context/features/dashboard-collections-spec.md` (scope, query view model, dominant-type tie-break, auth/sign-in companion, stats, states, caching, testing, acceptance checks). Status: In Progress.

Completed on branch `feature/dashboard-collections`:
- **Query layer** — added `src/db/queries/collections.ts` (`server-only`) with `getRecentCollections(userId, limit = 4)` and `getDashboardCounts(userId)`. Collections and the grouped type breakdown are two set-based queries (no N+1), each filtering `collections.ownerId` and `items.ownerId` on the resolved server-side user. "Recent" stays `collections.updatedAt DESC`.
- **Business rules** — extracted `src/features/collections/summary.ts` (`buildCollectionSummaries`, `sortTypesByUsage`, `pickDominantType`, `NEUTRAL_COLLECTION_COLOR`) so dominant-type selection, tie-break by system type order, `itemCount` (sum of per-type counts), and the empty-collection fallback are pure and testable.
- **Auth** — added `src/lib/auth-session.ts` (`getSession`, `getCurrentUser`, `requireUser` → `redirect("/sign-in")`), a minimal `/sign-in` route (`src/app/sign-in/page.tsx` + `src/components/auth/sign-in-form.tsx`) and `src/actions/auth.ts` (Zod-validated Server Action calling `auth.api.signInEmail`, generic error, `redirect("/dashboard")` on success). Added Better Auth's `nextCookies()` plugin so Server Actions can persist the session cookie, and passed `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` through `src/lib/env.ts` (optional in development, documented in `.env.example`).
- **UI** — `src/app/dashboard/page.tsx` is now an async Server Component that resolves the session and fetches collections + counts; `RecentCollections` and `StatsCards` take props. `ItemTypeIcon` accepts `{ key: string; color: string }` with a `Shapes` fallback; canonical type keys moved to `src/lib/system-item-types.ts` so the server query no longer pulls in `lucide-react`/`react`. Rebuilt the card tint from the dominant type and the type-icon row from the types actually present.
- **States** — added the empty-collections panel, `src/app/dashboard/loading.tsx` + `src/components/dashboard/dashboard-skeleton.tsx`, and `src/app/dashboard/error.tsx` (client boundary with `retry`).
- **Tests** — installed `vitest@5` (`bun run test`, `vitest.config.mts`, `src/test/server-only.ts` alias) and added 12 tests: owner scoping on both generated queries, dominant-type ordering/tie-break/custom-key ordering, item-count summation, and the empty/foreign-row cases.
- **Cosmetic reconciliation** — snippet icon is `CodeXml` in `mock-data`, the seed, and the project-overview type table (Lucide no longer ships `Code2`).
- **Verified** — against the Neon development branch: demo sign-in returns 200 with a session cookie, the session resolves, and `/dashboard` renders 18 items / 5 collections with the 4 newest cards (React Patterns, AI Workflows, DevOps, Terminal Commands) and the expected dominant tints; a random other user id returns 0 collections / 0 items. `bun run lint`, `bunx next typegen && bunx tsc --noEmit`, `bun run test` (12/12), and `bun run build` all pass. Status: Completed.
