# Workflow Reference — Gates, Context, Commits

**Status:** operational reference, not a spec. Read it when changing the gates, the feature commands, or how context is loaded.
**Baseline:** merge `7445c49` (2026-11-05), PR #3.
**Source of truth:** `scripts/gate.ts`, `.opencode/commands/feature/*.md`, and `context/ai-interaction.md`. This file explains *why*; it does not replace those.

## Baseline commits

| Commit | Concern |
| --- | --- |
| `49e4244` | One gate entry point (`scripts/gate.ts`, `gate` / `gate:fast`) |
| `f734f75` | Feature commands routed through the gate script |
| `bb34101` | History moved to `context/feature-history.md` |
| `9dcf2f4` | On-demand context loading in `AGENTS.md` |
| `7108cfd` | Reviewable commit-slicing rule |

## 1. Gate commands

| Command | Gates | When |
| --- | --- | --- |
| `bun run gate` | lint, types, tests, build | `/feature/test`; the single full pass per feature |
| `bun run gate:fast` | lint, types, tests | `/feature/implement` baseline and final report |
| `bun run gate -- --reuse` | reuses a matching stamp, otherwise all four | `/feature/complete` |
| `bunx next typegen && bunx tsc --noEmit --pretty false` | types | After each implement slice |
| `bunx vitest run <paths>` | targeted tests | After each implement slice |

The four gate steps, in order:

1. `eslint --quiet`
2. `next typegen`, then `tsc --noEmit --pretty false`
3. `vitest run --reporter=dot --bail=1`
4. `next build`

`gate` stops at the first failing gate. `--keep-going` exists but the workflow does not use it.

### Output

- Success is one line per gate, for example `gate tests PASS 96 passed (96)`.
- Failure prints the gate line plus the first or last 40 non-empty lines of that gate's log.
- Full output is kept in `.gate/<gate>.log`; never paste a whole log into the conversation.
- `.gate/` is gitignored (`/.gate/`); logs and the stamp are local only.

## 2. The gate stamp

A passing run writes `.gate/last.json`:

```json
{
  "treeHash": "sha256 of the working tree",
  "mode": "fast" | "full",
  "at": "ISO timestamp",
  "branch": "current branch",
  "gates": [{ "name": "lint", "summary": "" }, ...]
}
```

### How reuse works

- `--reuse` compares the current content hash to `treeHash`.
- A **full** stamp satisfies both `gate` and `gate:fast`.
- A **fast** stamp satisfies `gate:fast` only; a full request re-runs everything, including the build.
- The stamp is deleted before any fresh run, so a failure leaves none behind.
- The hash is built from `git ls-files -s`, `git diff --binary`, and hashes of untracked files. It is independent of `HEAD`, so a plain commit between `/feature/test` and `/feature/complete` does not invalidate it.
- The hash does **not** cover `.env` or `node_modules`; see Open nits.

## 3. Workflow by phase

| Phase | Runs | Deliberately does not run |
| --- | --- | --- |
| `/feature/implement` | `gate:fast` baseline and final report; typegen + `tsc` and targeted `vitest` per slice | No lint per slice, no build |
| `/feature/review` | Delegates inspection to the `feature-reviewer` subagent, then triages its findings in the main agent | No gates, no whole-repo scan, no edits |
| `/feature/test` | One `bun run gate`, then writes the full stamp | Does not run gates again after the pass |
| `/feature/complete` | `bun run gate -- --reuse`; slices and commits; pushes the branch and opens a PR when the diff contains code, merges locally only for docs-only diffs; appends history after merge | Does not rebuild a tree stamped by `/feature/test` |

### Shipping: pull request or local merge

`/feature/complete` inspects the diff before merging. If every changed path ends in `.md`, it merges locally with `--no-ff`. Any code, test, config, or lockfile change is pushed as a branch and handed over as a pull request; the history entry and the `current-feature.md` reset are committed only after that PR merges. `gh` is optional — without it the command reports the GitHub compare URL instead.

### History and current feature

- `context/current-feature.md` holds only the live feature (about 400 bytes).
- `context/feature-history.md` is the append-only ledger. `/feature/complete` appends one entry; nobody rewrites earlier entries.
- This split exists so every command that reads the live file does not also load the entire history.

### Manual habit (not automated)

Start a fresh session per phase (`start`, `implement`, `review`, `test`, `complete`). All state is in files, so a new session loses nothing and stops the whole transcript from being re-sent each turn.

## 4. Context loading

`AGENTS.md` defines on-demand reads instead of loading everything up front:

- `context/ai-interaction.md` — always.
- `context/coding-standards.md` — grep the relevant section. **Exception:** the `feature-reviewer` subagent loads it in full (about 4.1k tokens). A diff review must not guess which sections apply.
- `context/project-overview.md` — only for architecture, data model, environments, or pricing.
- `context/current-feature.md` — the live feature.
- `context/feature-history.md` — only when a task asks about past features.
- `context/features/*-spec.md` — only the active spec.
- `context/screenshots/` — never read as text.

Do not re-read an unchanged file in a later phase of the same session.

## 5. Commit slicing

From `context/ai-interaction.md` → Commits:

- One concern per commit; split a diff that mixes tooling, workflow docs, or a data move.
- Reviewable size: roughly 2–7 files.
- Never one mega-commit; never a split so small it cannot be explained on its own.
- Every commit must leave the tree consistent — no commit may depend on a later one to compile, lint, or run.
- `/feature/complete` proposes and commits one approved slice at a time.

## 6. Backlog — proposed, not implemented

Do not assume these exist:

- `review.md` reads whole changed files on purpose: hunks alone hide the surrounding ownership filters and boundary placement. The reviewer excludes generated files from its findings instead.
- `explain.md` is still a full step; make it on-demand.
- `scanner.md` still runs lint, typegen, `tsc`, and tests as separate commands; switch it to `gate:fast`.
- `coding-standards.md` and `project-overview.md` are not split into topic files.
- No requirements digest; `/feature/implement` still re-reads the full spec.
- The token reduction is an **estimate (about 50–70%), not a measured result**.
- Playwright deferred until the page set stabilizes. Resume with committed Playwright Test specs first; add the MCP only if exploratory verification is still needed. Do not add E2E to `gate`.

## 7. Open nits

- `scripts/gate.ts:48` — `eslint --quiet` also removes warnings from `.gate/lint.log`; dropping it would keep the signal without adding success output.
- `scripts/gate.ts:91` — the content hash ignores `.env` and `node_modules`, so an env or dependency change between `/feature/test` and `/feature/complete` is invisible.
- `scripts/gate.ts:177` — no test covers `treeHash` or stamp reuse; a hashing regression would silently skip gates.
- `.opencode/commands/feature/complete.md:15` — gates run before the commit message is approved; an edit made during approval ships ungated.
- `AGENTS.md:19` — "in a later phase" is ambiguous across sessions; say "in the same session".
- `.opencode/commands/feature/implement.md:25` — `next typegen` runs per slice even when no route was added.
- `context/ai-interaction.md:18` — still says `npm run test` / `npm run build`; the project uses bun and the gate script now owns this step.

## 8. Maintenance

Update this file whenever `scripts/gate.ts`, the feature commands, or the context-loading rules change. Keep the baseline commit and date current. This is a reference, not a second copy of the command files.
