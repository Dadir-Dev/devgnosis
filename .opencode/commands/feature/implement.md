---
description: Implement the loaded feature goal by goal, without leaving the spec
---

## Task

Implement the feature in `context/current-feature.md`, one goal at a time. Do not commit — `/feature/complete` owns that.

**1. Read the spec**

- `context/current-feature.md` for the goals and the spec path recorded in Notes.
- The spec itself, for requirements the goals compress.
- If the goals are empty or still `**No active feature**`: stop and point at `/feature/load`.

**2. Confirm the baseline is green**

`bun run lint`, `bunx next typegen && bunx tsc --noEmit`, `bun run test`.

A pre-existing failure is not yours to fix silently. Report it and stop, so a failure later is attributable to this feature.

**3. Work goal by goal**

Order the work by dependency: `src/db/schema` → `src/db/queries` → `src/features` → `src/actions` → `src/components` → `src/app`.

After each slice, re-run lint, typecheck, and the tests touching that slice. Leave the production build for the end.

**4. Rules for every change**

- Smallest diff that satisfies the goal. No unrelated refactors, renames, or reformatting.
- Do not add behaviour no goal covers. Ambiguous requirement: stop and ask, never invent.
- Owner-scoped queries and Zod validation at each boundary are not optional.
- `server-only` on modules that must not reach the client; `'use client'` only for interaction.
- Schema change: `bun run db:generate`, then read the generated SQL before applying it with `bun run db:migrate`. Never `db push`.
- No new dependency without asking. No `any`.
- Touch only files the goal needs.

**5. Stop conditions**

- The same error survives 2–3 attempts: stop and explain instead of trying variations.
- A goal needs a product decision, not an implementation decision: ask.
- The spec contradicts `context/coding-standards.md`: flag it, then follow the standard unless told otherwise.

**6. Report**

Per goal: done, or blocked and why. Then the files touched and the full gate result (`bun run lint`, typegen + type-check, `bun run test`, `bun run build`). End with `/feature/review`.
