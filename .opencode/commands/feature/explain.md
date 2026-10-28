---
description: Explain what a feature changed and how the pieces fit together
---

## Task

Explain only. Change nothing.

**1. Scope**

- Read `context/current-feature.md` for the goals and intended behaviour.
- Committed work: `git diff --name-status $(git merge-base main HEAD)...HEAD`.
- Uncommitted work: `git diff --name-status` and `git diff --cached --name-status`.
- New files: `git status --short`.
- Skip `bun.lock`, `next-env.d.ts`, `*.tsbuildinfo`, and `.next/`.

**2. Walk the files in flow order**

Order by layer, not alphabetically: `src/db/schema` → `src/db/queries` → `src/features` → `src/actions` → `src/components` → `src/app`. That is the direction data travels, so the explanation reads as one story instead of a changelog.

For each file:

- Path plus `(new)`, `(modified)`, `(deleted)`, or `(generated)`.
- One or two sentences on what it does and why it exists — the reason, not a paraphrase of the code.
- The key export or pattern worth knowing, when there is one.
- Flag `'use client'` files, `server-only` modules, and migrations, because they behave differently from their neighbours.

**3. Output**

## Files Changed

**`path`** (new)
Why it exists and what it does.

## How It All Connects

One short paragraph tracing the path end to end: what triggers the change, which server function owns it, which query reaches the database, and which component renders the result. Use the project's vocabulary — item, collection, tag, type, owner scope.

Do not explain files the diff did not touch. If nothing changed, say so and stop.
