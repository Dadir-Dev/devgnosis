# Dashboard Collections Spec

## Overview

Replace the dummy collection data displayed in the main area of the dashboard (right side),
with actual data from the database. It should look how it does now with the recent collection
cards, but instead of using data from `@src/lib/mock-data.ts`, it should come from our Neon
database using **Drizzle ORM** (the project does not use Prisma; see
`@context/coding-standards.md` → "Database: Neon PostgreSQL and Drizzle").

Do not add the items underneath yet. We will do that later.

## Scope

- In scope: the "Recent collections" grid in `@src/components/dashboard/recent-collections.tsx`
  and the item-type data it renders (icons + dominant color).
- In scope: the Items/Collections totals in the dashboard header and the first two stat cards
  (see "Stats").
- In scope: a minimal `/sign-in` flow so the authenticated read is reachable (see
  "Authentication and ownership").
- Out of scope: the pinned items, recent items, and sidebar sections. They continue to read
  `@src/lib/mock-data.ts` for now (see "Mixed data" note below).
- Out of scope: the collection detail pages (`/collections`, `/collections/[slug]`) and the
  items list inside a collection.

## Requirements

- Create `src/db/queries/collections.ts` with owner-scoped read functions.
- Resolve the authenticated user on the server and scope every query by `ownerId`; redirect to
  `/sign-in` when there is no session (see "Authentication and ownership").
- Add the minimal `/sign-in` flow required to obtain a session.
- Fetch collections directly in the `@src/app/dashboard/page.tsx` server component (do not fetch
  the app's own Route Handler, and do not add a client fetch).
- Render **4** recent collection cards (matches the current `slice(0, 4)` / `xl:grid-cols-4`
  layout and the `@context/screenshots/dashboard-ui-main.png` screenshot).
- Collection card border color derived from the **most-used content type** in that collection.
- Show small icons of all types present in that collection.
- Keep the current design (tint/border treatment, spacing, card structure).
- Update the collection stats display (see "Stats" below).

## Authentication and ownership

Every read is owner-scoped. Resolve the authenticated user on the server; never accept a
`userId` from the client.

- Add a server-only session helper (e.g. `src/lib/auth-session.ts` exporting
  `getCurrentUser()`), backed by Better Auth:

  ```ts
  import { headers } from "next/headers";

  import { auth } from "@/lib/auth";

  export async function getSession() {
    return auth.api.getSession({ headers: await headers() });
  }
  ```

  (`better-auth` guarantees `headers` is required for this endpoint.)
- The dashboard page/query resolves the session, then passes the resolved `userId` into the
  query. The query itself filters `collections.ownerId = userId` (and scopes the item/type join
  the same way).
- **No session behavior (decided):** `redirect("/sign-in")`. Do not fall back to loading another
  user's or an unscoped user's data.
- The shared query module must import `"server-only"`.

### Minimal sign-in (required companion)

The dashboard becomes an authenticated read, so a session must be obtainable. There is currently
no auth UI, so this slice adds the smallest possible sign-in flow to make the feature testable
end to end. Keep it minimal; polish (sign-out in the sidebar, GitHub OAuth, password reset,
styling) is deferred.

- Add `/sign-in` (`src/app/sign-in/page.tsx`): a small client form (email + password) that
  submits a Server Action.
- The Server Action calls Better Auth (`auth.api.signInEmail({ body, headers })`) and, on
  success, `redirect("/dashboard")`. On failure, return a safe inline error (no provider/stack
  details).
- The demo credentials from `@context/features/seed-spec.md`
  (`demo@devgnosis.app` / `12345678`) can be shown as a hint in non-production only.
- Do not add sign-up, OAuth, or sign-out in this slice unless the implementer needs sign-out to
  verify redirect behavior.

## Query module: `src/db/queries/collections.ts`

Follow the coding-standards layout (`src/db/queries/` = composable read queries) rather than
`src/lib/db/`.

- Export a function such as `getRecentCollections(userId: string, limit = 4)` returning a
  serializable view model. Do not return raw rows the component must re-derive.
- Derive the view model from the schema in `src/db/schema` (`typeof collections.$inferSelect`
  where useful); do not hand-maintain duplicate table shapes.
- Required per-collection output:
  - `id`, `slug`, `name`, `description`
  - `itemCount` (total items in the collection, owner-scoped)
  - `types`: the distinct item types present, each with `id`, `key`, `name`, `color`, `icon`,
    and its `count` (for the icon row and the dominant-type calculation)
- **Dominant ("most-used") content type:** the item type with the highest item count in the
  collection, computed with an aggregate over
  `item_collections → items → item_types`. Tie-break deterministically — use the system type
  order (`snippet`, `prompt`, `note`, `command`, `link`, `file`, `image`) so the color is
  stable. Collections with no items fall back to the existing neutral tint `#6B7280` and show
  no type icons.
- Ordering (decided): "recent" = `collections.updatedAt DESC`. This matches the current behavior
  and the existing `collections_owner_updated_idx` index. Caveat: `collections.updatedAt` only
  changes when the collection row is written; adding an item does not bump it, and `db:seed`
  sets `updatedAt = now()` on every run, which flattens the order after a re-seed. Revisit using
  `createdAt` or `max(item_collections.addedAt)` only if this looks wrong with real data.
- Keep the query set-based (a grouped join), not N+1 per collection. The `(owner)` indexes in
  the schema already cover these reads.

## Rendering the card

`@src/components/dashboard/recent-collections.tsx` keeps its current markup/tint treatment but:

- Reads the collection list from props passed by the page (server → component), not from
  `@/lib/mock-data`.
- Uses `types` from the query to render the small type-icon row, and the dominant type's color
  for `backgroundColor` / `borderColor` (the documented runtime inline-style exception).
- Uses `itemCount` from the query view model instead of the mock `itemCount`.

### Item type resolution refactor

`@src/components/dashboard/item-type-icon.tsx` currently types its prop as `MockItemType` and
`@src/lib/item-types.ts` resolves types from `@/lib/mock-data`. These must accept DB-derived
types:

- Change `ItemTypeIcon` to accept a minimal structural type (e.g.
  `{ key: string; color: string }`, or a shared `ItemTypeView`) so both mock callers and the new
  query can satisfy it. Prefer a shared `type` exported from the query module.
- `TYPE_ICONS` is keyed by `MockItemTypeKey`; DB `key` is `string`. Add a safe fallback icon for
  an unknown/omitted key so a custom type cannot crash the card. (Note the existing cosmetic
  mismatch: mock data labels snippet as `Code2` while `TYPE_ICONS` maps it to `CodeXml` —
  reconcile when moving off mock.)
- Keep `ItemTypeIcon` a Server Component (no `'use client'`).

## Stats

"Update collection stats display" is scoped (decided) to the counts that the real collection
read makes inconsistent:

- The per-card `{itemCount} items` count (from the query view model).
- **Items total** and **Collections total** — the header line in
  `@src/app/dashboard/page.tsx` ("N items across M collections") and the first two stat cards in
  `@src/components/dashboard/stats-cards.tsx`. Provide a small owner-scoped
  `getDashboardCounts(userId)` (`count(*)` over `items` and `collections`) and pass the values
  down as props so the header and stat cards stay coherent.

`favoriteItems` and `favoriteCollections` stat cards, and `addedThisWeek`, are **out of scope**
for this slice and keep their current (mock-derived) values. Leave the section heading as
**"Recent collections"** (the code's current label; the screenshot's "Collections" is not
adopted here).

## Empty, loading, and error states

Treat these as designed states (coding standards):

- **Empty:** when the user has no collections, render a meaningful empty state instead of an
  empty grid (keep the section heading and "View all" link).
- **Loading:** add `src/app/dashboard/loading.tsx` (or a Suspense boundary) with a skeleton that
  matches the card grid.
- **Error:** ensure `src/app/dashboard/error.tsx` exists with a user-safe message.

## Caching

`next.config.ts` sets `cacheComponents: true`, so data fetching is dynamic by default. This is
**per-user, owner-scoped** data and must not be cached globally. Do not wrap the query in
`'use cache'`; if caching is ever added, it must be keyed/tagged per user.

## Mixed data note

For this slice the dashboard shows real collection cards, real per-card counts, and real
Items/Collections totals, while the sidebar, pinned items, recent items, and the
favorites/`addedThisWeek` stats still read `mock-data`. That is acceptable but visible
(e.g. real totals vs. mock sidebar type counts). Do not remove the shared `mock-data` module
yet — it is still used by `sidebar.tsx`, `stats-cards.tsx`, `pinned-items.tsx`, and
`recent-items.tsx`.

Also note the seeded collections (`React Patterns`, `AI Workflows`, `DevOps`,
`Terminal Commands`, `Design Resources`) differ from the mock/screenshot names (e.g. "DevOps
Toolkit", "Launch Notes"), so the real dashboard will not match the screenshot card-for-card.
"Keep the current design" means keep the layout/treatment, not these exact cards.

## Testing

- Add Vitest coverage for the new query/service behavior: owner scoping (another user's
  collections are never returned), dominant-type selection including the tie-break, and the
  empty-collections case. Mock the DB boundary, not the business rule.

## Acceptance checks

- Signed out, visiting `/dashboard` redirects to `/sign-in`; signing in with the demo
  credentials lands on `/dashboard`.
- Signed in as the demo user, `/dashboard` renders 4 collection cards sourced from the database,
  and the header/stat-card Items and Collections totals match the DB.
- Card border/background tint reflects the most-used item type; the type-icon row matches the
  types actually present.
- No query returns data outside the resolved user's ownership.
- Empty/loading/error states render correctly.
- `bun run lint`, `bunx next typegen && bunx tsc --noEmit`, and `bun run build` pass.

## References

- `@context/screenshots/dashboard-ui-main.png` — layout reference.
- `@context/coding-standards.md` — project organization, ownership, RSC/data-read rules.
- `@context/project-overview.md` — item-type icons/colors, UX direction.
- `@context/features/database-spec.md` — Drizzle/Neon client, schema conventions.
- `@context/features/seed-spec.md` — demo user and seeded collections/items.
- `@src/db/schema/collections.ts`, `@src/db/schema/items.ts`, `@src/db/schema/item-types.ts`.

## Resolved decisions

1. **No-session behavior** — `redirect("/sign-in")`; add a minimal `/sign-in` page as a required
   companion so the authenticated read is testable.
2. **"Recent" definition** — `collections.updatedAt DESC` (existing index and behavior).
3. **Stats scope** — wire Items and Collections totals (header + first two stat cards); defer
   favorite counts and `addedThisWeek`.
4. **Header label** — keep **"Recent collections"** (the code's current label).
