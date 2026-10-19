# Dashboard Items Spec

## Overview

Replace the dummy item data displayed in the main area of the dashboard (right side),
with actual data from the database. This includes both pinned and recent items. It should
look how it does now, but instead of using data from `@src/lib/mock-data.ts`, it should come
from our Neon database using **Drizzle ORM** (the project does not use Prisma; see
`@context/coding-standards.md` → "Database: Neon PostgreSQL and Drizzle").

If there are no pinned items, nothing should display there.

## Scope

- In scope: the Pinned section in `@src/components/dashboard/pinned-items.tsx`.
- In scope: the Recent items section in `@src/components/dashboard/recent-items.tsx`.
- In scope: the item-type data those components render (icons, names, and colors).
- In scope: the item-related numbers in the dashboard header and stat cards
  (see "Stats").
- In scope: seeding tags for the demo items so the tag chips shown by the current
  design are testable against the database (see "Seed companion").
- Out of scope: the sidebar. It continues to read `@src/lib/mock-data.ts` for now.
- Out of scope: the item detail drawer, item creation/editing, pin/favorite toggles,
  search, `/items/[type]`, and the `/collections` pages.
- Out of scope: collection cards themselves. They already read the database and keep
  their current behavior.

## Requirements

- Create `src/db/queries/items.ts` with owner-scoped read functions.
- Resolve the authenticated user on the server and scope every item query by `ownerId`;
  redirect to `/sign-in` when there is no session (already handled by `requireUser()`).
- Fetch items directly in `@src/app/dashboard/page.tsx` (do not fetch the app's own
  Route Handler, and do not add a client fetch).
- Render up to **2** pinned items (matches the current two-up layout and the
  `@context/screenshots/dashboard-ui-main.png` screenshot) and the **10** most recently
  updated items.
- Keep the current design: card structure, spacing, checklist/code/prose previews,
  type icon treatment, pin/favorite indicators, tag chips, and relative timestamps.
- Derive the pinned card's border/background tint and both sections' type icon from the
  item's joined `item_types` row, not from `@/lib/mock-data`.
- Hide the Pinned section entirely when there are no pinned items.
- Show a meaningful empty state for the Recent items section when the user has no items.
- Update the item-related stats display (see "Stats" below).

## Authentication and ownership

Every read is owner-scoped. Resolve the authenticated user on the server; never accept a
`userId` from the client.

- `@src/app/dashboard/page.tsx` already calls `requireUser()` and passes `user.id` to the
  collection queries. Pass the same resolved `user.id` to the item queries.
- Every item query filters `items.ownerId = userId`.
- The tag lookup filters `tags.ownerId = userId` as well as restricting `item_id` to the
  already owner-scoped item ids. A stale or foreign join row must never leak another
  user's tag.
- The shared query module imports `"server-only"`.
- No session behavior remains `redirect("/sign-in")`; do not fall back to unscoped data.

## Query module: `src/db/queries/items.ts`

Follow the coding-standards layout (`src/db/queries/` = composable read queries) rather
than `src/lib/db/`, matching `@src/db/queries/collections.ts`.

- Export owner-scoped functions such as:

  ```ts
  getPinnedItems(userId: string, limit = 2): Promise<DashboardItem[]>
  getRecentItems(userId: string, limit = 10): Promise<DashboardItem[]>
  ```

- Return a serializable view model; do not make components re-derive type or tag data.

- Required per-item output:

  ```ts
  type ItemTypeView = {
    id: string;
    key: string;
    name: string;
    color: string;
    icon: string;
    contentKind: "text" | "url" | "file";
  };

  type DashboardItem = {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    url: string | null;
    fileName: string | null;
    language: string | null;
    tags: string[];
    isFavorite: boolean;
    isPinned: boolean;
    /** ISO string because RelativeTime formats string timestamps. */
    updatedAt: string;
    type: ItemTypeView;
  };
  ```

- Derive the view model from the schema in `src/db/schema` (`typeof items.$inferSelect`
  where useful); do not hand-maintain duplicate table shapes.

- Join `item_types` on `items.itemTypeId` in the item query. Do not reuse
  `getItemTypeById()` from `@/lib/item-types`; that helper resolves mock data.

- Ordering:
  - Recent items: `items.updatedAt DESC`, then `items.id ASC` as a deterministic tie-break
    (the seed writes all rows in one transaction, so timestamps can tie).
  - Pinned items: `items.updatedAt DESC`, then `items.id ASC`, limited to 2.
  - `items_owner_updated_idx` already covers the owner-plus-updated ordering.

- Tags: fetch them in **one batch query**, not per item. Join `item_tags` to `tags`,
  filter by the owner-scoped item ids, and group the names by item id in memory. Select
  tags ordered by `tags.normalizedName` so chip order is stable.
- Keep the reads set-based (one item query plus one tag query), not N+1.
- Convert `updatedAt` to `.toISOString()` in the view model.

## Rendering

### `@src/components/dashboard/pinned-items.tsx`

- Accept the pinned items from props (server → component), not from
  `@/lib/mock-data`.
- Remove the module-level `items.filter(...)` and `MockItem` imports.
- Keep `ChecklistPreview` and `ItemContentPreview`, but type them with
  `DashboardItem`.
- Extend the preview fallbacks for the three content modes:
  - text: current code-block / checklist / prose behavior;
  - url: show the URL or its hostname in muted text;
  - file/image: show the file name in muted text.
- Render the item type with `ItemTypeIcon` using `item.type`.
- Derive the card accent from the type color. The screenshot and requirement call for a
  type-colored border; use the same subtle runtime inline-style treatment as the
  collection cards (a low-alpha background and border from `item.type.color`). This is
  the documented runtime-derived inline-style exception.
- Keep the pin icon, favorite star, `#{tag}` chips, and "Edited {relative time}" footer.
- If `items.length === 0`, return `null` (the whole section disappears).

### `@src/components/dashboard/recent-items.tsx`

- Accept the recent items from props, not from `@/lib/mock-data`.
- Remove the module-level sort/slice and `MockItem` imports.
- Render the type icon and type name from `item.type`.
- Keep the subtitle priority: `description` → `#tag #tag` list → type name.
- Keep the relative timestamp using the ISO `updatedAt`.
- Render a meaningful empty panel (keep the section heading) when the list is empty,
  styled consistently with the collections empty state.

### Page wiring

`@src/app/dashboard/page.tsx` fetches the new data in the existing `Promise.all`:

```ts
const [recentCollections, counts, pinnedItems, recentItems] = await Promise.all([
  getRecentCollections(user.id),
  getDashboardCounts(user.id),
  getPinnedItems(user.id),
  getRecentItems(user.id),
]);
```

Pass `pinnedItems` and `recentItems` down as props. Do not add a client component or a
client fetch for this slice.

### Cleanup

Once both components stop calling `getItemTypeById()`, remove that helper and its now-unused
`@/lib/mock-data` imports from `@src/lib/item-types.ts`. Keep `TYPE_ICONS` and
`FALLBACK_TYPE_ICON`, which the sidebar and collection cards still use. Do not leave dead
code or unused imports (coding standards).

## Stats

The dashboard currently mixes real collection counts with mock item/favorite counts. This
slice makes the whole header and stat row real:

- Header: `{counts.items} items across {counts.collections} collections · {counts.addedThisWeek} added this week`.
- Stat cards:
  - Items: `counts.items`
  - Collections: `counts.collections`
  - Favorite items: `counts.favoriteItems`
  - Favorite collections: `counts.favoriteCollections`

Extend the existing `DashboardCounts` type and `getDashboardCounts(userId)` (currently in
`@src/db/queries/collections.ts` / `@src/features/collections/summary.ts`) rather than
creating a second competing dashboard-counts function:

```ts
type DashboardCounts = {
  items: number;
  collections: number;
  favoriteItems: number;
  favoriteCollections: number;
  addedThisWeek: number;
};
```

- All five counts are owner-scoped and run in parallel.
- `favoriteItems` counts `items.isFavorite = true` for the owner.
- `favoriteCollections` counts `collections.isFavorite = true` for the owner.
- `addedThisWeek` means **created in the last rolling 7 days** (`items.createdAt >= now - 7 days`),
  not the calendar week. Document this if the label is later changed.
- `@src/components/dashboard/stats-cards.tsx` becomes fully prop-driven and no longer
  imports `@/lib/mock-data`.
- Keep the greeting as-is. `dashboardStats.greeting` is presentation text, not user data,
  and may stay in the mock module until that module is retired.

No schema change is required for these counts. The existing owner-scoped indexes are
sufficient at MVP scale; add an index only if a measured read justifies it.

## Seed companion: tags

The current design shows `#tag` chips, but `@src/db/seed.ts` never writes `tags` or
`item_tags`. Without a seed change, real pinned cards would render no tags.

Extend the existing idempotent demo seed (same transaction as the item/collection upserts):

- Add an optional `tags?: string[]` field to `SeedItem`.
- Give the seeded items a small set of realistic tags matching their content (for example
  `react`, `hooks`, `typescript` for the React snippets; `prompt`, `review`, `refactor`
  for the AI workflows; `docker`, `bash`, `git`, `bun` for DevOps/Terminal; `tailwind`,
  `ui`, `design`, `icons` for Design Resources).
- Normalize tag names consistently (trim + lowercase) into `normalizedName`.
- Upsert `tags` on the `(ownerId, normalizedName)` unique index and insert `item_tags`
  with `onConflictDoNothing()`, so re-running `bun run db:seed` stays idempotent.
- Keep tag writes inside the existing transaction.

This is the minimum needed to verify tag rendering. Retired seed tags still will not be
pruned; that is the known seed follow-up already recorded in
`@context/current-feature.md`, not new scope for this feature.

## Empty, loading, and error states

Treat these as designed states (coding standards):

- **Empty pinned:** render nothing; the section heading and grid are omitted.
- **Empty recent items:** keep the "Recent items" heading and show a meaningful panel
  (e.g. "No items yet — items you save will appear here.").
- **Loading:** `@src/app/dashboard/loading.tsx` already renders the dashboard skeleton.
  Update `@src/components/dashboard/dashboard-skeleton.tsx` only if the new markup or stat
  props change the skeleton's shape.
- **Error:** `@src/app/dashboard/error.tsx` already provides a user-safe recovery state.
  Keep it covering the new reads.

## Caching

`next.config.ts` sets `cacheComponents: true`, so data fetching is dynamic by default. This
is **per-user, owner-scoped** data and must not be cached globally. Do not wrap the item
queries in `'use cache'`; if caching is ever added, it must be keyed/tagged per user.

## Mixed data note

After this slice, the dashboard main area is fully database-backed: header, stat cards,
pinned items, recent items, and collection cards. The sidebar still reads `mock-data`, so
its type counts, favorites, and recent collections can disagree with the main area until
the sidebar gets its own slice. Do not remove `@src/lib/mock-data.ts` yet; it is still used
by `@src/components/dashboard/sidebar.tsx` and for the greeting.

Seeded data also differs from the screenshot's card names, so "keep the current design"
means keep the layout/treatment — not the exact mock/screenshot content.

## Testing

Add Vitest coverage for the new query/service behavior, following
`@src/db/queries/collections.test.ts`:

- owner scoping on the pinned query, recent query, tag query, favorite-item count, and
  `addedThisWeek` count (another user's rows are never included);
- pinned filtering (`isPinned = true`) and the limit;
- recent ordering by `updatedAt DESC` with the deterministic `id` tie-break and limit;
- tag lookup is a single batch scoped by owner and item ids;
- `favoriteCollections` is owner-scoped and only counts `isFavorite = true`;
- the rolling-7-day boundary for `addedThisWeek`;
- empty results produce an empty array (and the component hides the pinned section).

Mock the DB boundary where useful, not the business rule. Prefer asserting generated SQL
with `toSQL()`, as the collections query tests already do.

## Acceptance checks

- Signed in as the demo user, `/dashboard` renders pinned and recent items sourced from
  the database, with no item content read from `@/lib/mock-data`.
- With no pinned items, the Pinned section does not render at all.
- Pinned card border/background and icon reflect the item type color; recent rows show the
  type icon and name.
- Tag chips render from `item_tags`, and re-running `bun run db:seed` does not duplicate
  tags or join rows.
- The four stat cards and the "added this week" header value come from owner-scoped
  database counts.
- Empty, loading, and error states render correctly.
- No query returns data outside the resolved user's ownership.
- `bun run lint`, `bunx next typegen && bunx tsc --noEmit`, `bun run test`, and
  `bun run build` pass.

## References

- `@context/screenshots/dashboard-ui-main.png` — layout and design reference.
- `@context/coding-standards.md` — project organization, ownership, RSC/data-read rules,
  Drizzle-only database policy.
- `@context/project-overview.md` — item-type icons/colors, UX direction.
- `@context/features/dashboard-collections-spec.md` — precedent for dashboard query,
  prop-driven rendering, and mixed-data notes.
- `@context/features/database-spec.md` — Drizzle/Neon client and schema conventions.
- `@context/features/seed-spec.md` — demo user and seeded collections/items.
- `@src/db/schema/items.ts`, `@src/db/schema/item-types.ts`, `@src/db/schema/tags.ts`,
  `@src/db/queries/collections.ts`, `@src/components/dashboard/pinned-items.tsx`,
  `@src/components/dashboard/recent-items.tsx`.

## Resolved decisions

1. **ORM** — Drizzle ORM against Neon PostgreSQL. Prisma is not used.
2. **Query location** — `src/db/queries/items.ts`, not `src/lib/db/`.
3. **Ownership** — every item and tag read is scoped by the server-resolved `userId`.
4. **Limits** — 2 pinned items and 10 recent items; `updatedAt DESC` with `id ASC` as the
   deterministic tie-break.
5. **Tags** — render user tags (`#{tag}` chips) in pinned cards and the item type name in
   recent rows; seed tags so the real dashboard matches the design.
6. **Card accent** — pinned card border/background uses the item type color as a subtle
   tint, matching the screenshot and the collection-card treatment.
7. **Stats** — all four stat cards plus `addedThisWeek` become database-backed; "this week"
   means the last rolling 7 days.
8. **Empty states** — pinned hides entirely; recent items shows a designed empty panel.
9. **Caching** — no `'use cache'`; the reads are per-user and dynamic.
10. **Sidebar** — remains on mock data; retiring it is a separate slice.
