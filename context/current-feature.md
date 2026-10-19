# Current Feature

**Seed Data — Demo User, Collections & Items**

Expand `src/db/seed.ts` from system item types into a full development/demo seed: create the demo account through Better Auth, set its `user_profiles` plan, and populate five collections with their snippets, prompts, commands, and links. Full data contract in `@context/features/seed-spec.md`.

## Status

<!-- Not Started | In Progress | Completed -->
Completed

## Goals

<!-- Goals and requirements -->

- **Idempotent.** Running `bun run db:seed` repeatedly (and on every deploy) must not duplicate rows: every write is an upsert or a no-op conflict.
- **Demo user.** `demo@devgnosis.app` / `Demo User` / password `12345678`, created via `auth.api.signUpEmail` (Better Auth owns password hashing — never hand-hash), with `emailVerified: true` so it can sign in immediately. Plan `free` in `user_profiles` (no standalone entitlement boolean).
- **System item types.** Keep the existing deterministic upsert of the seven system types (snippet, prompt, command, note, file, image, link) with their icons, colors, and `contentKind`.
- **Collections & items.** Upsert the collections below and their items, then link items to collections:
  - **React Patterns** — “Reusable React patterns and hooks” — 3 TypeScript snippets (custom hooks, component/context patterns, utilities).
  - **AI Workflows** — “AI prompts and workflow automations” — 3 prompts (code review, documentation generation, refactoring).
  - **DevOps** — “Infrastructure and deployment resources” — 1 snippet (Docker/CI config), 1 command (deployment script), 2 links (real URLs).
  - **Terminal Commands** — “Useful shell commands for everyday development” — 4 commands (Git, Docker, process management, package manager utilities).
  - **Design Resources** — “UI/UX resources and references” — 4 links (real URLs: CSS/Tailwind, component libraries, design systems, icon libraries).

## Notes

<!-- Additional notes or comments -->

- **Overwrite notice:** this replaces the previous contents of `src/db/seed.ts` (which only seeded the seven system item types). The item-type block is preserved and the rest is added around it.
- **Stable ids.** Items get deterministic UUIDs derived from a seed key (SHA-256 of `devgnosis:seed:<key>`) so re-runs upsert in place instead of creating duplicates. Collections upsert on the `(owner_id, slug)` unique index and return their id; item↔collection joins upsert on the composite primary key with `ON CONFLICT DO NOTHING`.
- **Transactions.** Collection/item inserts and their join rows run inside `db.transaction` so the graph stays consistent (per the coding standards’ multi-step-invariant rule).
- **Out of scope.** Tags, favorites, and pins are not part of the seed spec and are intentionally not seeded; they can be layered on later without changing this contract.
- **Deferred — prune (follow-up).** Removing an item or collection from `COLLECTIONS` does not delete the already-seeded row on re-run, so retired rows linger; when the real data-fetching feature lands, the demo account should be reset (delete its collections/items, then re-insert) so it matches the seed exactly. Deferred now because the demo seed has no production blast radius and the correct approach depends on the still-unbuilt write path.

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
Completed on branch `feature/seed-data`: expanded `src/db/seed.ts` from the seven system item types into a full development/demo seed per `@context/features/seed-spec.md`. The demo account (`demo@devgnosis.app` / `12345678`) is created through `auth.api.signUpEmail` (Better Auth owns hashing) and `emailVerified` is set true so it can sign in immediately; its `user_profiles` row upserts to the `free` plan. Added five collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) with three TypeScript snippets, three prompts, two commands, and four links (real URLs), plus the item↔collection joins. Idempotency uses deterministic SHA-256-derived UUIDs for items, an upsert on the `(owner_id, slug)` collection index, and `ON CONFLICT DO NOTHING` joins, all inside one transaction. Verified against the Neon development branch: two consecutive `bun run db:seed` runs leave exactly 1 user, 1 profile, 5 collections, 18 items, and 18 joins, with lint / type-check / production build green. Status: Completed.
