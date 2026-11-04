# Dashboard Read Path Spec

## Overview

Close four read-path findings from `SCAN-FINDINGS.md` that all land on the
authenticated `/dashboard` request: the session is resolved twice, the stat
cards issue five COUNT round-trips for two tables, the sidebar reads every
collection and computes the same type breakdown twice, and the recent-items list
ships full item bodies nothing renders.

Baseline from the scan: a `/dashboard` load issues **17 statements** for roughly
**9** distinct pieces of data. The target after this feature is **~11**, with no
change to what the page displays.

Findings covered: **M4, M5, M6, M7**. This is a performance and cost feature —
none of it is currently exploitable.

## Status

Not Started

## Background

`SCAN-FINDINGS.md` recommended this order: H1 (auth rate limiter), then M4, then
M5 + M7 + M6. **H1 is already complete** on `main` (`77997b7`, `src/lib/rate-limit.ts`),
so this feature starts at M4.

The statement budget is spent like this today:

| Read | Statements | Source |
| --- | ---: | --- |
| Session + user | 2 | `layout.tsx:22`, `page.tsx:18` → `auth-session.ts:16` |
| User plan | 1 | `layout.tsx:23` |
| Sidebar item types | 1 | `layout.tsx:26` |
| Sidebar collections + breakdown | 2 | `collections.ts:134`, `:137` |
| Favorite item count | 1 | `layout.tsx:28` → `collections.ts:176` |
| Recent collections + breakdown | 2 | `collections.ts:93`, `:96` |
| Dashboard counts | 5 | `collections.ts:214-220` |
| Pinned items + tags | 2 | `items.ts:110`, `:97` |
| Recent items + tags | 2 | `items.ts:119`, `:97` |

The duplicate/parallel reads, not row count, are the cost. Nothing here is N+1.

## Requirements

### M4 — Resolve the session once per request

- `getSession()` (`src/lib/auth-session.ts:16`) must be memoized for the
  lifetime of a single request/render pass.
- Both call sites — `dashboard/layout.tsx:22` and `dashboard/page.tsx:18` — must
  resolve to one session+user DB read per `/dashboard` load.
- `getCurrentUser`, `requireUser`, and `requireGuest` must inherit the dedupe
  without changing their signatures or behaviour. `requireUser` must still
  redirect to `/sign-in` on a missing session.
- `/sign-in` and `/sign-up` keep working through `requireGuest()`.

### M5 — Two filtered aggregates instead of five counts

- `getDashboardCounts` (`src/db/queries/collections.ts:203-229`) must produce all
  five values (`items`, `collections`, `favoriteItems`, `favoriteCollections`,
  `addedThisWeek`) using **one aggregate per table**: one over `items`, one over
  `collections`, using `count(*) filter (where …)`.
- `addedThisWeek` keeps its rolling seven-day window
  (`getAddedThisWeekSince`, `collections.ts:198-200`) — not a calendar week.
- Every aggregate stays owner-scoped on `ownerId`; no owner value may come from
  the client.
- The favorite-item count read by the sidebar (`getFavoriteItemCount`,
  `collections.ts:176-179`) and the `favoriteItems` value inside
  `getDashboardCounts` must not both hit the database in one request. Whichever
  way it is shared, the layout and the page must agree on the number.

### M6 — Bound the sidebar collection read

- `sidebarCollectionsQuery` (`collections.ts:109-125`) must stop reading every
  owner collection. Read only what the sidebar renders: **all favorites** plus
  **the four most recent non-favorites**.
- The sidebar's dominant-type color must keep working for both sections, so
  `collectionTypeBreakdownQuery` must still run over exactly that bounded id set.
- The type breakdown must run **once** per request, not once for the sidebar and
  again for the main-area cards (`getRecentCollections`, `collections.ts:89-102`).
  The two surfaces must not disagree about a collection's count or dominant
  color.
- Ordering stays deterministic: `updatedAt DESC`, then `name ASC`, then `id ASC`.
- The four-recents slice must move out of `buildSidebarCollections`
  (`src/features/dashboard/sidebar.ts:127`) into the query, or the query must
  guarantee the builder receives an already-bounded set.

### M7 — Stop shipping the `content` column to the recent-items list

- `recentItemsQuery` (`items.ts:63-71`) must not select `content`, `url`,
  `fileName`, or `language`. `RecentItems` renders only `title`, `description`,
  `tags`, `type`, and `updatedAt` (`src/components/dashboard/recent-items.tsx:29-58`).
- Pinned items keep the full column set — `PinnedItems` renders the body
  (`pinned-items.tsx:61`, `:68`).
- The narrow row must not be assignable to the pinned row type, so a future edit
  cannot silently reintroduce the wide select on the list query.
- `getPinnedItems` and `getRecentItems` keep their current signatures and
  ordering (`updatedAt DESC`, `id ASC`).

## Decisions

- **Request-scoped memoization only.** Use React `cache()`. Do **not** use
  `unstable_cache`, the `'use cache'` directive, a module-level variable, or
  `globalThis` for the session or the counts. `'use cache'` cannot read
  `headers()`/cookies at all, and a process-global cache would serve one user's
  session to every other user. `cache()` is per-request, so it collapses
  duplicates without ever serving a stale session.
- **`cache()` the count functions, not just the session.** M4 and M5 share one
  mechanism: `getSession` and the count queries are memoized by argument, so the
  layout and the page converge on one read each.
- **Do not delete the small exported count queries unless they become dead.**
  `favoriteItemCountQuery` also backs the sidebar. If a single aggregate
  supersedes a helper, remove the helper and its test rather than leaving two
  sources of truth.
- **Column sets, not column lists inline.** Keep a shared base column object and
  derive the narrow list set from it, so the two item queries cannot drift.
- **Narrow view model for the list.** `DashboardItem` stays the full pinned view
  model; the recent list gets a narrower type without `content`/`url`/`fileName`/
  `language`. Prefer an explicit second builder over making the payload fields
  optional on the shared one — optional fields would let `RecentItems` start
  depending on data that is no longer selected.
- **One feature, four commits.** Land M4, M5, M6, M7 as separate commits in that
  order so each is independently reviewable and revertable.
- **No caching across requests.** Nothing in this feature adds a cache layer,
  `cacheLife`, or `cacheTag`. Cross-request caching for `getSidebarItemTypes` and
  `getUserPlan` stays deferred (SCAN-FINDINGS L2) until write paths exist to
  invalidate against.

## Implementation

- `src/lib/auth-session.ts` — wrap `getSession` in React `cache()`.
- `src/db/queries/collections.ts` — two filtered-aggregate count queries replacing
  the five; bounded `sidebarCollectionsQuery` (favorites + four recents); one
  shared breakdown path for sidebar and main-area cards.
- `src/db/queries/items.ts` — split `ITEM_COLUMNS` into base/list/pinned sets;
  `recentItemsQuery` selects the narrow set.
- `src/features/items/dashboard-items.ts` — narrow recent-item row and builder.
- `src/features/dashboard/sidebar.ts` — receive an already-bounded collection set
  if the slice moves into SQL.
- `src/components/dashboard/recent-items.tsx` — prop type follows the narrow view
  model; no rendering change.

No schema change, no migration, no new dependency.

## Acceptance checks

- A `/dashboard` load resolves the session **once** (one `session` join to `user`,
  not two), verified in the query log or with a temporary statement counter.
- The dashboard header and all four stat cards show the same numbers as before
  the change, including `addedThisWeek` across the seven-day boundary.
- The sidebar shows every favorite plus the four most recent non-favorites, with
  unchanged ordering, item counts, and dominant-type dots; favorites still show
  the star.
- Recent collection cards and the sidebar agree on each collection's count and
  dominant color.
- `getRecentItems` no longer selects `content`, `url`, `fileName`, or `language`;
  `getPinnedItems` still does.
- Pinned and recent sections render identically to before.
- Owner scoping is unchanged on every query: a foreign user id returns zero rows,
  and `item_tags`/breakdown reads still repeat the owner predicate.
- `bun run lint`, `bunx next typegen && bunx tsc --noEmit`, `bun run test`, and
  `bun run build` pass.
- Query tests are updated for the new shapes, keeping one shape assertion per
  query rather than full SQL-string matching (see SCAN-FINDINGS L8).

## Out of scope

- **H1 cross-instance rate limiting.** The limiter shipped in `77997b7` is
  in-process, so it throttles per warm instance. Fixing that needs a shared store
  (Redis/Upstash) and a `rateLimit.storage` setting in `src/lib/auth.ts` — an
  infrastructure decision, not part of this feature.
- **M8** — pinned cards rendering the entire item body. Adjacent to M7 but a
  separate rendering change.
- **L2** — `'use cache'` for `getSidebarItemTypes` / `getUserPlan`.
- **L8** — replacing SQL-substring tests with fixture-backed behavioural tests.
  This feature updates the affected assertions; it does not rewrite the strategy.
- Any change to what the dashboard displays.

## Risks

- **Session leak.** The single most dangerous mistake here is making the session
  cache cross-request. `cache()` only; never a module-level store.
- **Silent divergence.** If the sidebar and the page compute counts from
  different reads, a stale favorite or a mismatched dominant color can appear
  without any error. Acceptance checks must compare the two surfaces.
- **Filtered aggregates are easy to get subtly wrong.** `count(*) filter (where …)`
  must keep the owner predicate outside the filter (in `WHERE`), so foreign rows
  never reach the aggregate.
- **`addedThisWeek` boundary.** The rolling window is computed from `now`; a test
  that freezes time must still cover both sides of the cutoff.

## Follow-up

- Re-measure the `/dashboard` statement count after M7 and record it here; the
  scan's ~9-distinct-reads target is the floor.
- Consider whether the dashboard should read counts once in the layout and pass
  them to the page, which would remove the need for `cache()` on the counts.
  App Router layouts cannot pass props to pages, so this needs a shared
  request-scoped accessor — not a redesign of the route.
