<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# devgnosis

a developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

Next.js 16 App Router starter. Package manager is **bun** (`bun.lock`, `packageManager: bun@1.3.6`) — use `bun run <script>`, not npm/yarn/pnpm.

## Context Files

Load these on demand, not up front. The repo is the source of truth; do not re-read an unchanged file in a later phase.

- `context/ai-interaction.md` — read first, always. Workflow, branching, commit, and review rules.
- `context/coding-standards.md` — grep the relevant section (for example `## Testing and quality gates`) instead of reading all ~16 KB.
- `context/project-overview.md` — read only when the task touches architecture, data model, environments, or pricing.
- `context/current-feature.md` — the live feature only; it is deliberately short.
- `context/feature-history.md` — do not read unless a task asks about past features. Append-only; never rewrite it.
- `context/workflow-reference.md` — read only when changing gates, workflow commands, or context-loading rules.
- `context/features/*-spec.md` — only the one spec the active feature names.

Never read `context/screenshots/` as text.

## Commands

- `bun run dev` — dev server at http://localhost:3000 (Turbopack)
- `bun run build` — production build (Turbopack; does not lint)
- `bun run start` — serve the production build
- `bun run lint` — ESLint only. `next lint` was removed in Next 16, so there is no `next lint`.
- `bun run gate` — all four gates in order (lint, typegen + type-check, tests, build). Prints one line per gate; full logs in `.gate/`.
- `bun run gate:fast` — the first three gates, no production build.
- `bun run gate -- --reuse` — reuse `.gate/last.json` when the tree hash matches a previous full pass.
- Type-check: `bunx next typegen && bunx tsc --noEmit` (no `typecheck` script exists)

`next typegen` is required before type-checking because route type helpers (`LayoutProps`, `PageProps`, `RouteContext`) are generated globally during `dev`/`build`/`typegen` — `src/app/layout.tsx` already relies on `LayoutProps<"/">`.

## Next.js 16 quirks this repo depends on

- `next.config.ts` sets `cacheComponents: true` and `partialPrefetching: true`. This means: **data fetching is dynamic by default**; opt into caching with the `'use cache'` directive, paired with `cacheLife()`/`cacheTag()`. PPR (static shell + streamed dynamic content) is the default rendering model. Read `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` and `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` before touching data fetching.
- Request APIs are **async-only**: `await params`, `await searchParams`, `await cookies()`, `await headers()`, `await draftMode()`. Synchronous access was removed in 16.
- `middleware.ts` is renamed `proxy.ts` (Node runtime only).
- Parallel-route slots require an explicit `default.js`.

Full upgrade notes: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.

## Layout & styling

- App Router lives in `src/app`; `@/*` maps to `./src/*`.
- Tailwind CSS v4 is enabled via a Turbopack loader rule in `next.config.ts` (`*.css` -> `@tailwindcss/turbopack`), **not** PostCSS — there is no `postcss.config.mjs`. Tailwind's `@import "tailwindcss";` lives at the top of `src/app/globals.css`.

## Neon MCP (database access for agents)

`opencode.jsonc` configures two Neon MCP servers against the single Neon project that owns the `development`, `preview`, and `production` branches:

- `neon` — the default. `?readonly=true&category=schema&category=querying&category=docs`. No writes, no branch create/reset/delete, no migrations.
- `neon-unrestricted` — `disabled: true`. Full access, for deliberate development-branch work only.

Rules:

- Never enable `neon-unrestricted` while pointed at, or asked about, production. Neon MCP scoping is project-wide, so an enabled unrestricted server can reset or delete the `production` branch.
- Disable `neon-unrestricted` again as soon as the development-branch task is done.
- `readonly=true` blocks writes but does **not** block reads: the agent can still `SELECT` production rows (user emails, password hashes, OAuth identities). Do not use MCP to browse production user data.
- Schema changes still go through reviewed Drizzle migrations (`bun run db:generate` / `db:migrate`), never through MCP SQL.
