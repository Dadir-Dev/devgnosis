---
description: Load a feature or fix spec into context/current-feature.md
---

## Task

`$ARGUMENTS` is a spec slug or an inline feature description.

**1. Resolve the request**

- Empty: stop and say `load requires a spec slug or feature description.`, then list the specs available under `context/features/` and `context/fixes/` (if it exists).
- Matches `^[a-z0-9][a-z0-9-]*$`: treat it as a slug and look for, in order:
  1. `context/features/$ARGUMENTS-spec.md`
  2. `context/features/$ARGUMENTS.md`
  3. `context/fixes/$ARGUMENTS-spec.md`
  4. exactly one `context/features/*$ARGUMENTS*.md`

  If nothing matches, list the available specs and stop. Never invent a spec.
- Anything else: treat it as an inline feature description and derive 3–6 goals from it, labelled as draft.

**2. Guard the current feature**

Read `context/current-feature.md`. If `## Status` is `In Progress`, stop and ask before replacing it. `## History` is an append-only log and must never be lost.

**3. Update `context/current-feature.md`**

Edit only the feature line, `## Status`, `## Goals`, and `## Notes`. Do not create or modify any other file.

- Keep the `# Current Feature` H1 and all HTML comment placeholders.
- Leave `## History` byte-for-byte unchanged.
- Feature line: `**<Feature name>** — <one-line description>`, replacing `**No active feature**`.
- Status: `Not Started`.
- Goals: bullets taken from the spec's own requirements, not invented. For an inline description, prefix the section with `Draft goals — confirm before starting.`
- Notes: the spec path, plus any open decisions the spec lists.

**4. Confirm**

Report the feature name, spec path, status, and the goals as bullets. End with the next step: `/feature/start $ARGUMENTS`.
