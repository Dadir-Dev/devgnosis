# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works in the browser. Run `npm run test` for unit tests and `npm run build` to check for errors
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after build passes and everything works
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark the feature completed in @context/current-feature.md and append the entry to @context/feature-history.md

Do NOT commit without permission and until the build and tests pass. If build or tests fail, fix the issues first.

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused: one concern per commit. Split a diff that mixes unrelated concerns (tooling, workflow docs, a data move) into separate commits on the same branch.
- Size each commit to be reviewable: roughly 2–7 files. Never land a feature as one large commit, and never split into commits too small to explain on their own (a lone import, formatting, or a one-line rename).
- A commit must leave the tree consistent — no commit may depend on a later one to compile, lint, or run.
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)

`/feature/review` delegates the inspection to the read-only `feature-reviewer` subagent and triages its findings in the main agent, so the authoring session does not grade its own work.
