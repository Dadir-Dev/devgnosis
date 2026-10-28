---
description: Review the feature diff against its goals and this project's standards
---

## Task

Report only. Do not edit files, run formatters, or commit.

**1. Establish scope**

- Read `context/current-feature.md` for the feature name, goals, and recorded branch.
- Collect the diff against the branch point: `git merge-base main HEAD`, then `git diff --stat <base>...HEAD` and `git diff <base>...HEAD`.
- Add uncommitted work: `git diff`, `git diff --cached`, and `git status --short` for untracked files.
- Empty diff: say so and stop.

Read the changed files, not just the stat output.

**2. Check the goals**

- ✅ **Met** — the goal, and the file or behaviour that satisfies it.
- ❌ **Missing or partial** — the goal, and what is absent.
- 🚫 **Scope creep** — work in the diff that no goal covers.

**3. Check this project's invariants**

- **Ownership**: every read and mutation is scoped by the server-derived user; no `userId` from the client; item/tag/collection joins verify same-owner.
- **Validation**: Zod at each boundary; actions return a typed `{ ok, data } | { ok, error }` result.
- **Boundaries**: no server-only module imported into a client component; `'use client'` only where interaction requires it.
- **Next 16**: `await params` / `searchParams` / `cookies()` / `headers()`; no synchronous request APIs.
- **Data**: schema changes ship with a generated migration; never `db push`.
- **Tests**: new logic has Vitest coverage; no `any`, no dead or commented-out code, no unused imports.

**4. Report**

Group findings as ❌ **Blocker**, ⚠️ **Should fix**, or 💡 **Nit**. Each finding is one line: `path:line` — what is wrong, why it matters, and which standard it violates. No praise, and do not narrate what the code does.

End with exactly one verdict — `Ready to complete` or `Needs changes` — plus the number of files reviewed.
