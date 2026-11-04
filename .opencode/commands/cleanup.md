---
description: Audit the repo for housekeeping issues; report only unless given "run"
---

## Task

Mode is `$ARGUMENTS`. Empty or `check`: report only, change nothing. `run` or `fix`: report, then ask which items to fix. Never print a secret value, and never edit `.env`.

**1. Feature history**

`context/feature-history.md` reads oldest to newest and each entry is internally consistent (branch name, commit sha, verification claim). Report entries that are out of order, malformed, or contradict a later one.

**2. Debug leftovers**

`console.log` and `debugger` under `src/`, each with `path:line`. Report `console.error` / `console.warn` separately — in an error path they may be deliberate, and a blind sweep would delete them.

**3. Imports and type escapes**

Run `bun run lint` first: ESLint already reports unused imports and variables, so don't grep for what the tool answers better. Then find `@ts-ignore` and `@ts-expect-error`. Both are banned by `context/coding-standards.md`; `@ts-expect-error` fails once stale, `@ts-ignore` fails silently forever.

**4. Stale TODOs**

`TODO`, `FIXME`, `XXX`, `HACK` under `src/`. For each, say whether the surrounding code still matches what the comment describes.

**5. Unused files**

Report `src/` files with no importer, excluding things that are never imported by design: Next.js conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, `template.tsx`, `default.tsx`, `proxy.ts`), `*.test.ts`, `src/db/seed.ts`, `src/db/smoke*.ts`, `src/db/migrations/**`, and `src/db/schema/**` (reached through the barrel). When a file's status is uncertain, report it as "verify manually", never as "delete".

**6. Context drift**

- `current-feature.md` matches the branch and status it claims.
- Every spec under `context/features/` is referenced by a History entry, matched by **slug** rather than filename (entries often cite only the branch, e.g. `feature/dashboard-collections`), or is a known pending feature. Report only specs whose slug appears nowhere.
- Versions named in `context/project-overview.md` and `context/features/database-spec.md` match `package.json`: Drizzle `0.45.4`, drizzle-kit `0.31.11`, Better Auth `1.7.10`, Next `16.4.3`.
- Scripts named in the docs exist in `package.json`.

**7. Environment variables**

There is no `.env.production` here; production values live in Vercel. So compare **names only**, across three sources: the `envSchema` keys in `src/lib/env.ts`, `.env.example`, and `.env`. Report keys present in one and missing from another, and keys in `.env` the schema never reads. Never print, diff, or paraphrase a value.

**8. Report**

Numbered findings, most severe first, each as `path:line` — what is wrong and the smallest fix. Then, in `run`/`fix` mode only, ask exactly:

> Which items would you like me to fix? (numbers like 1,3,5, or "all", or "none")

Wait for the answer. Fix only the chosen items, keep each concern to its own edit, and never delete a file without an explicit yes for that item. Finish by listing what changed and what was deliberately left alone.
