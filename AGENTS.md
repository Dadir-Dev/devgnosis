<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# devgnosis

a developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

Next.js 16 App Router starter. Package manager is **bun** (`bun.lock`, `packageManager: bun@1.3.6`) — use `bun run <script>`, not npm/yarn/pnpm.

## Context Files

  Read the following files to get the full context of this project:
  
  - @context/project-overview.md
  - @context/coding-standards.md
  - @context/ai-interaction.md
  - @context/current-feature.md

## Commands

- `bun run dev` — dev server at http://localhost:3000 (Turbopack)
- `bun run build` — production build (Turbopack; does not lint)
- `bun run start` — serve the production build
- `bun run lint` — ESLint only. `next lint` was removed in Next 16, so there is no `next lint`.
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
- Tailwind CSS v4 is enabled via a Turbopack loader rule in `next.config.ts` (`*.css` -> `@tailwindcss/turbopack`), **not** PostCSS — there is no `postcss.config.mjs`. Put Tailwind's `@import "tailwindcss";` in `src/app/globals.css` when styling.
- `src/app/globals.css` is currently **empty**, so no Tailwind utilities render until that import is added back.
