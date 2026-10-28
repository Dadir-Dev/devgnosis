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

`bun run lint` → `bunx next typegen && bunx tsc --noEmit` → `bun run test` → `bun run build`.

Any failure stops the flow: do not commit. Point at `/feature/test` and stop.

**3. Propose the commit**

Draft a conventional message (`feat:` / `fix:` / `chore:`) describing the user-visible change. No attribution trailers, no "Generated with". Show the message with `git diff --stat` and **ask for approval**. Commit only after a yes.

**4. Merge**

- `git switch main`, then confirm it matches `origin/main` when a remote exists.
- `git merge --no-ff <branch>` so the feature boundary stays visible in history.
- A conflict stops here. Resolve nothing automatically.

**5. Delete the local branch**

Only after `git branch --merged` lists it. Never with `-D`.

**6. Reset `context/current-feature.md`**

Append to the **end** of `## History`, matching the existing entry style:

```md
**<Feature name>** (commit `<short sha>`)
Completed on branch `<branch>` (merged to `main`): <2–4 sentences — what shipped, the key files, and the verification result: lint, typegen + type-check, tests n/n, production build>.
```

Then reset the live sections: feature line back to `**No active feature**`, Status `Not Started`, clear Goals and Notes while keeping their HTML comments. Do not touch earlier History entries.

**7. Commit, then push**

Commit the reset as `chore: reset current-feature.md after <feature>`. Then **ask** before `git push origin main` — a single push, never `--force`. Delete the remote branch only if it was pushed earlier.
