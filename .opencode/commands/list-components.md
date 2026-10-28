---
description: List React components in src/components, optionally scoped to one subdirectory
---

## Task

List every React component file under `src/components/`.

Components here are `.tsx` files. Skip `.ts` files in that tree — they are helpers and modules, not components. Never search `node_modules/` or `.next/`.

Known subdirectories: `auth/`, `dashboard/`, `ui/`.

If `$ARGUMENTS` is provided, restrict the results to that subdirectory. Accept a bare name (`dashboard`) or a path (`src/components/dashboard`). If nothing matches, reply `No components found in <subdirectory>.` and list the available subdirectories rather than guessing.

## Output format

One numbered list, ordered by subdirectory then filename:

1. `src/components/dashboard/sidebar.tsx` — collapsible navigation sidebar (client)
2. `src/components/dashboard/stats-cards.tsx` — summary stat cards (server)

- Path relative to the repo root, in backticks.
- One line describing what it renders. Infer from the filename; open the file only when the name is opaque.
- Append `(client)` when the file starts with `'use client'`, otherwise `(server)`, so the server/client boundary stays visible.
- End with a count, e.g. `19 components: 5 auth, 12 dashboard, 2 ui.`

If no files are found, say `No components found.`
