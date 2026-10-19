# Current Feature

<!-- Feature name and short description -->


## Status

<!-- Not Started | In Progress | Completed -->
Completed

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Additional notes or comments -->

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
- `@src/lib/mock-data.ts` is still the source for the sidebar, pinned items, recent items, and the favorite/`addedThisWeek` stats, so the dashboard mixes real and mock numbers. Retire it section by section.
- `/collections` and `/collections/[slug]` do not exist yet, so the "View all" link and every collection card currently navigate to a 404.
- No `/api/auth/[...all]` Route Handler is mounted; the Server Action calls Better Auth directly. Add the handler if a Better Auth client or OAuth is introduced.
- There is no sign-out anywhere, and the seeded demo password is shown on `/sign-in` outside production.
- `collections.updatedAt` only changes when the collection row is written — adding an item does not bump it. Revisit `createdAt` or `max(item_collections.addedAt)` if "recent" looks wrong with real data.
- `bun run db:seed` still does not prune retired seed rows (see the Seed Favorites & Pins note above).
