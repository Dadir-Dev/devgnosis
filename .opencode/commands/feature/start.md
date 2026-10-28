---
description: Create the feature branch and mark the current feature In Progress
---

## Task

**1. Read `context/current-feature.md`**

- Feature line still `**No active feature**`: stop with `No feature loaded. Run /feature/load <spec> first.`
- `## Goals` empty or containing only its HTML comment: stop with the same message.
- Status already `In Progress`: stop and confirm before continuing, since the branch may exist.

**2. Derive the branch name**

- Slugify the feature name from the `**...**` line: lowercase, kebab-case, at most 50 characters.
- Prefix `feature/`. Use `fix/` when the loaded spec came from `context/fixes/`.
- `$ARGUMENTS`, when provided, is the branch name verbatim.

**3. Check the working tree**

Run `git status --porcelain`. If it is not empty, stop and list the files. Do not branch or stash on the user's behalf — committing or stashing is their decision.

**4. Create the branch**

- Branch already exists: check it out and report that it was resumed rather than created.
- Otherwise `git switch -c <branch>`. No empty commit.

**5. Update `context/current-feature.md`**

- Set `## Status` to `In Progress`.
- Record `Branch: \`<branch>\`` under `## Notes`, replacing any earlier `Branch:` line.
- Leave `## History` unchanged.

**6. Stop**

Report the branch name, then list the goals as a checklist. Do not write code — `/feature/implement` does that. End with that as the next step.
