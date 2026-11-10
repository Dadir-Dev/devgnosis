---
description: Verify, commit, merge, and reset current-feature.md for a finished feature
---

## Task

This command ends up committing, merging, and pushing. Do each step only after the previous one is verified, and **never commit or push without explicit approval**.

**1. Verify the feature is finished**

- Read `context/current-feature.md`: goals, recorded branch, status.
- Status not `In Progress`: stop and report the actual state instead of guessing.
- `git status --short` shows changes unrelated to the feature: stop and ask.

**2. Run the gates, in order**

`bun run gate -- --reuse`. With `--reuse` it reuses `.gate/last.json` when the tree hash still matches a full pass from `/feature/test`; otherwise it runs lint → typegen + type-check → tests → build.

Any failure stops the flow: do not commit. Point at `/feature/test` and stop. Quote only the failing gate's preview.

**3. Propose the commits**

Group the diff into reviewable slices per `context/ai-interaction.md` → Commits: one concern per commit, roughly 2–7 files, no single mega-commit. Draft a conventional message (`feat:` / `fix:` / `chore:`) for each slice, in order. No attribution trailers, no "Generated with". Show the messages with `git diff --stat` and **ask for approval**. Commit only after a yes, one slice at a time.

**4. Ship the change**

Pick the path from the diff against the branch point (`git diff --name-only <base>...HEAD`):

- **Docs-only** — every changed path ends in `.md`. `git switch main`, confirm it matches `origin/main` when a remote exists, then `git merge --no-ff <branch>` so the feature boundary stays visible in history. A conflict stops here. Resolve nothing automatically. Continue to step 5.
- **Anything else** — `src/`, `scripts/`, `package.json`, configs, tests, migrations, lockfiles. Push the branch, open a pull request, and **stop**. Do not merge locally, do not delete the branch, and do not reset `current-feature.md`.

```powershell
git push -u origin <branch>
# gh installed:
gh pr create --base main --title "<feature>" --body "<what shipped + verification>"
# otherwise report the compare URL:
# https://github.com/<owner>/<repo>/compare/main...<branch>?expand=1
```

Report the PR URL and stop. After the PR is merged, run `/feature/complete` again: `main` already contains the branch, so skip to step 6 (history + reset).

**5. Delete the local branch**

Docs-only merges only. Only after `git branch --merged` lists it. Never with `-D`. A pull request deletes its branch on GitHub.

**6. Reset `context/current-feature.md`**

Append to the **end** of `context/feature-history.md`, matching the existing entry style:

```md
**<Feature name>** (commit `<short sha>`)
Completed on branch `<branch>` (merged to `main`): <2–4 sentences — what shipped, the key files, and the verification result: lint, typegen + type-check, tests n/n, production build>.
```

Then reset the live sections of `context/current-feature.md`: feature line back to `**No active feature**`, Status `Not Started`, clear Goals and Notes while keeping their HTML comments. Never edit `context/feature-history.md` except to append.

**7. Commit, then push**

Commit the reset as `chore: reset current-feature.md after <feature>`. Then **ask** before `git push origin main` — a single push, never `--force`. Delete the remote branch only if it was pushed earlier.
