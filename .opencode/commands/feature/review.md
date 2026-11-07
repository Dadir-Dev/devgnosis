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

Do not read the changed files here; the reviewer does that. Read a file only to settle a finding you doubt during triage.

**2. Delegate the inspection**

Spawn the `feature-reviewer` subagent. Pass it, verbatim:

- the goals and spec path from `context/current-feature.md`;
- the full diff;
- the changed-file list, including untracked files.

Do not summarise the implementation, explain your design choices, or hint at what to find. It must judge from the code alone. It reads `context/coding-standards.md` itself.

**3. Triage**

Drop findings that are wrong or out of scope: pre-existing code the diff does not touch, generated files, deferred features, and style ESLint does not flag. Keep every finding you cannot disprove by reading the code.

**4. Report**

Group findings as ❌ **Blocker**, ⚠️ **Should fix**, or 💡 **Nit**. Each finding is one line: `path:line` — what is wrong, why it matters, and which standard it violates. No praise, and do not narrate what the code does.

Then a **Dismissed** list: one line per rejected reviewer finding, `path:line — why it does not apply`.

End with exactly one verdict — `Ready to complete` or `Needs changes` — plus the number of files reviewed.
