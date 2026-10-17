# Current Feature

<!-- Feature name and short description -->
**Database Foundation — Neon PostgreSQL + Drizzle ORM**
Set up Drizzle ORM against the Neon PostgreSQL database: the DevGnosis application schema, the Better Auth tables, indexes/constraints, and the versioned-migration and seed workflow. Prisma is not used.

## Status

<!-- Not Started | In Progress | Completed -->
In Progress

## Goals

<!-- Goals and requirements -->

Implement `@context/features/database-spec.md` end to end:

- **Dependencies (bun):** `drizzle-orm` and `drizzle-kit` on the **stable v0 line** (`drizzle-orm@0.45.x`, `drizzle-kit@0.31.x` — not the v1 `@rc`), plus `@neondatabase/serverless`, `better-auth`, `@better-auth/drizzle-adapter`, and `ws`; dev tooling `dotenv`. Pin exact versions in `package.json`.
- **Environment:** `DATABASE_URL` (direct, non-pooler) for `drizzle-kit` (`generate`/`migrate`/`check`/`studio`/seeds); `DATABASE_URL_POOLED` (PgBouncer) for the app runtime — both pointing at the same Neon branch. Validate env vars with Zod in a server-only module (`src/lib/env.ts`) and fail fast. Add `.env.example` (with a `!.env.example` negation in `.gitignore`); never commit real credentials.
- **Config:** `drizzle.config.ts` using `dotenv/config`, PostgreSQL dialect, `schema: ./src/db/schema/*`, `out: ./src/db/migrations`, direct `DATABASE_URL`, `strict`/`verbose`.
- **Client:** `src/db/index.ts` — `import "server-only"`, `neon-serverless` WebSocket driver (`Pool` + `ws`), cached pool across dev hot reloads, `drizzle({ client: pool, schema })`, reads via `DATABASE_URL_POOLED`.
- **Auth tables:** generate `user`, `session`, `account`, `verification` with the Better Auth CLI into `src/db/schema/auth.ts` (text PKs, so app `owner_id`/`user_id` FKs are `text`, not `uuid`); re-export from `schema/index.ts`.
- **Application schema** (`src/db/schema/`): `item_types` (+ `content_kind` enum), `items` (payload-exclusivity and file-metadata `CHECK`s, generated `search_vector` + GIN index), `collections` + `item_collections`, `tags` + `item_tags`, `user_profiles` + `subscriptions`, and `relations.ts` for `db.query.*`.
- **Conventions:** `snake_case` in PostgreSQL / camelCase in TypeScript, `uuid` PKs (`defaultRandom()`), `timestamptz` timestamps, cascade deletes for user-owned records, `restrict` for deliberate deletes, `varchar` + app validation (not `pgEnum`) for `plan`/`status`.
- **Migrations:** add `db:generate`, `db:migrate`, `db:check`, `db:studio`, `db:seed`, `auth:generate` scripts. Author against the development branch, generate, **review the SQL**, then migrate; migrations are append-only/immutable once shared. **No `db:push` script.**
- **Seeding:** idempotent `src/db/seed.ts` upserting the seven system item types (Snippet, Prompt, Note, Command, Link, File, Image) on the `item_types_system_key_idx` partial unique index (with its `is_system` predicate). Do not use `drizzle-seed` for this.
- **Verification:** type-check (`bun x next typegen && bun x tsc --noEmit`) and lint pass; `db:generate`/`db:migrate`/`db:check` succeed on a fresh Neon dev branch; cascade/`restrict`/`CHECK` behaviors hold; full-text search returns owner-scoped ranked results; re-running the seed changes nothing; `db/index.ts` uses `DATABASE_URL_POOLED` while `drizzle.config.ts` uses `DATABASE_URL`.

## Notes

<!-- Additional notes or comments -->

- **Progress (implemented + verified on `feature/neon-drizzle`):** deps installed on the stable v0 line (`drizzle-orm@0.45.4`, `drizzle-kit@0.31.11`) plus `@neondatabase/serverless`, `better-auth@1.7.10`, `@better-auth/drizzle-adapter`, `ws`, `zod`, `server-only`, `dotenv`. Added `src/lib/env.ts` (Zod env validation), `drizzle.config.ts`, `src/db/index.ts` (pooled `neon-serverless` client, `server-only`), the full `src/db/schema/*` (auth generated via CLI + app tables + `relations.ts` + `index.ts`), `src/db/seed.ts`, and the `db:*` / `auth:generate` scripts. Migration `0000_youthful_blockbuster.sql` reviewed and applied to the Neon dev branch; seed run twice (idempotent); `db:check`, type-check, lint, and production build all pass; a throwaway verification run confirmed the payload/owner `CHECK`s, item→join cascade, item_type `restrict`, user-delete cascade, GIN search, and the seven system types. Not yet committed/merged — status stays In Progress.
- **Caveat — `auth:generate` and `server-only`:** the Better Auth CLI aborts when `server-only` is in the import graph, so temporarily remove the `import "server-only";` lines from `src/db/index.ts` and `src/lib/env.ts`, run `bun run auth:generate`, then restore them. Recorded in `database-spec.md`.
- **Decision — Drizzle line (DONE):** use the **stable v0 line** (`drizzle-orm@0.45.x` / `drizzle-kit@0.31.x`) and the v0 docs, not the v1 `@rc`. Recorded in `@context/features/database-spec.md`. The array-return form used in the spec's schema samples is supported on 0.45.x.
- **Decision — Better Auth profile/entitlement fields (DONE):** keep Better Auth's generated tables (`user`, `session`, `account`, `verification`) **auth-only** and put app profile/entitlement fields in a separate `user_profiles` table (keyed by `user_id`, cascade delete), **not** `additionalFields` on `user`. `@context/project-overview.md` was updated in the same change so the two documents agree.
- Neon branch promotion is the deploy path: the same migration files authored on the development branch are applied to production — there is no `push` step in either environment.
- `.env` already provides both `DATABASE_URL` and `DATABASE_URL_POOLED` for the development branch.
- Interactive transactions (item + join rows, idempotent webhooks) are why the WebSocket `neon-serverless` driver is the default; `neon-http` is single-statement only and not used for reads unless measured pressure justifies it.
- Suggested branch: `feature/neon-drizzle` (per `@context/ai-interaction.md`).

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
