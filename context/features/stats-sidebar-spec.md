# Stats & Sidebar Spec

## Overview

Finish retiring the dashboard's mock data by wiring the sidebar to the Neon
database. The main-area stats are already database-backed; this feature covers
the sidebar's item types, collections, user identity, and favorites count, plus
the last remaining mock value on the dashboard (the greeting).

## Status

Completed.

## Scope update

The original spec asked to move the main-area stats off
`@src/lib/mock-data.ts`. That work was completed in the earlier
`feature/dashboard-items` branch: `StatsCards` already receives owner-scoped
`DashboardCounts` from `src/db/queries/collections.ts`. The only dashboard
values still read from mock data are:

- `dashboardStats.greeting` in `src/app/dashboard/page.tsx`
- `currentUser`, `itemTypes`, `collections`, and `items` in
  `src/components/dashboard/sidebar.tsx`

## Requirements

- Keep the existing dashboard stats and layout unchanged; they are already
  database-backed.
- Display the system item types in the sidebar with their icons and
  owner-scoped item counts, linking to `/items/[typename]`.
- Favorite collections keep the star icon.
- Recent collections show a colored circle based on the collection's
  most-used item type (neutral `#6B7280` when the collection is empty).
- Add a "View all collections" link under the collections list that goes to
  `/collections`.
- Reflect the signed-in user's plan in the item-type list:
  - Free users see the existing `PRO` badge for Pro-only types (File, Image)
    instead of an item count.
  - Pro users see item counts for every type and no `PRO` badge.
- Keep the current sidebar labels (plural: `Snippets`, `Prompts`, ...), even
  though seeded type names are singular.
- Replace the mock greeting with a local `Good morning` constant.

## Decisions

- **Module location:** use `src/db/queries/` per `context/coding-standards.md`.
  Extend the existing `src/db/queries/items.ts` rather than creating
  `src/lib/db/items.ts`; `src/lib/db/` does not exist.
- **Plan source:** read `user_profiles.plan` and `plan_status`; treat only
  `pro` + `active`/`trialing` as Pro. Missing profile rows fall back to `free`.
- **Pro-only types:** derived from `content_kind === "file"` (File, Image)
  rather than adding a schema column. No migration is required.
- **Sidebar data flow:** `src/app/dashboard/layout.tsx` is a Server Component.
  It resolves the user, loads the sidebar data, and passes serializable props
  to the client `Sidebar` component.
- **Reuse:** `buildCollectionSummaries` and `collectionTypeBreakdownQuery`
  already compute the most-used type, so the sidebar uses the same dominant
  color logic as the collection cards.
- **Route pages deferred:** `/collections` and `/items/[type]` are not part of
  this feature. The new links will 404 until those pages are implemented in a
  later feature.

## Implementation

- `src/features/dashboard/sidebar.ts` — serializable sidebar view models and
  pure builders (`buildSidebarItemTypes`, `buildSidebarCollections`,
  `formatTypeLabel`).
- `src/db/queries/items.ts` — `systemItemTypeCountsQuery` and
  `getSidebarItemTypes` (system types left-joined to owner-scoped item counts).
- `src/db/queries/collections.ts` — `sidebarCollectionsQuery`,
  `getSidebarCollections` (favorites + four most recent non-favorites), and
  `getFavoriteItemCount`.
- `src/db/queries/profiles.ts` — `userPlanQuery` and `getUserPlan`.
- `src/lib/plans.ts` — shared `UserPlan` type and effective-plan normalization.
- `src/app/dashboard/layout.tsx` — resolves the user and loads sidebar data.
- `src/components/dashboard/sidebar.tsx` — prop-driven; removes all
  `mock-data` imports.
- `src/app/dashboard/page.tsx` — local greeting constant; removes the last
  `mock-data` import.

## Acceptance checks

- Every sidebar item type is a system type with its color, icon, live
  owner-scoped count, and a link to `/items/[key]`.
- File/Image show `PRO` for free users and a count for Pro users.
- Favorite collections show a star; recents show a colored dot derived from
  the collection's dominant type.
- "View all collections" links to `/collections`.
- Sidebar user name/email and the Favorites count come from the database.
- No file imports `src/lib/mock-data.ts`.
- Owner-scoped query tests, lint, type-check, unit tests, and production build
  pass.

## Follow-up

- `src/lib/mock-data.ts` is now unused and should be deleted after this
  feature is verified in the browser. It was intentionally left in place for
  this implementation.
- Implement `/collections` and `/items/[type]` so the sidebar and collection
  card links resolve.
