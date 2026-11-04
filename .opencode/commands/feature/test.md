---
description: Add the feature's missing tests, then run lint, types, tests, and build
---

## Task

Write the tests the feature is missing, then prove the tree is green.

**1. Find the testable surface**

- Read `context/current-feature.md`, then the diff since the branch point (`git merge-base main HEAD`).
- List new or changed logic in `src/features/**`, `src/db/queries/**`, `src/actions/**`, and the Zod schemas that guard them.
- Check for an existing `*.test.ts` beside each subject.

**2. Write only the tests that earn their place**

- Vitest, colocated as `<subject>.test.ts`.
- Cover the happy path, boundaries, and error cases; cover owner scoping for every query.
- Mock external boundaries (`@/db`, Better Auth, R2, Stripe, the AI provider), never the rule under test.
- Skip components and markup. Behaviour that cannot be proven another way is the only reason to test them.
- Do not assert the implementation back at itself. If a function has no meaningful failure mode, leave it untested and say why.

**3. Run the gates, in order**

`bun run gate` — lint → typegen + type-check → tests → build. It prints one line per gate and keeps full logs in `.gate/`.

Stop at the first failure and fix it. Quote only the failing gate's preview; never paste a whole log. If the same failure survives 2–3 attempts, stop and explain it instead of trying variations.

When all four pass, `.gate/last.json` is stamped for reuse by `/feature/complete`. Do not run the gates again after that.

Never make a gate pass by weakening it: no `any`, no `@ts-expect-error`, no skipped tests, no deleted assertions, no loosened Zod schema. A test that found a real bug means fixing the source.

**4. Report**

- One line per gate: pass, or the failing test and error. Full logs live in `.gate/<gate>.log`; do not paste them.
- Tests added: file, subject, cases.
- Deliberately untested: what, and why.
- No coverage percentage — no provider is configured, and inventing a number is worse than omitting it. Report which behaviours are covered.
- `bun run db:smoke` needs a live Neon branch and is out of scope here; say so rather than running it.
