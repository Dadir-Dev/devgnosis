import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { collections, itemCollections, itemTypes, items } from "@/db/schema";
import {
  buildCollectionSummaries,
  type CollectionSummary,
  type DashboardCounts,
} from "@/features/collections/summary";
import {
  buildSidebarCollections,
  type SidebarCollections,
} from "@/features/dashboard/sidebar";

/**
 * Owner-scoped read queries for the dashboard's collection cards.
 *
 * Every query filters on the resolved server-side `userId`; no caller may pass
 * a client-supplied owner. Queries are set-based (one grouped join), not N+1.
 */

/**
 * Base rows for the "recent collections" cards. "Recent" is `updatedAt DESC`,
 * which the `collections_owner_updated_idx` index covers. `name`/`id` break
 * ties deterministically: the seed writes every collection in one transaction,
 * so all rows share `updated_at = now()` and the 4-of-5 slice would otherwise
 * be arbitrary (and change between requests).
 */
export function recentCollectionsQuery(userId: string, limit: number) {
  return db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
    })
    .from(collections)
    .where(eq(collections.ownerId, userId))
    .orderBy(
      desc(collections.updatedAt),
      asc(collections.name),
      asc(collections.id),
    )
    .limit(limit);
}

/**
 * One grouped row per `(collection, item type)`. Owner-scoped on both the
 * collection and the item, so a stale join can never leak another user's data.
 */
export function collectionTypeBreakdownQuery(
  userId: string,
  collectionIds: string[],
) {
  return db
    .select({
      collectionId: itemCollections.collectionId,
      typeId: itemTypes.id,
      typeKey: itemTypes.key,
      typeName: itemTypes.name,
      typeColor: itemTypes.color,
      typeIcon: itemTypes.icon,
      itemCount: count(items.id),
    })
    .from(itemCollections)
    .innerJoin(items, eq(items.id, itemCollections.itemId))
    .innerJoin(itemTypes, eq(itemTypes.id, items.itemTypeId))
    .innerJoin(collections, eq(collections.id, itemCollections.collectionId))
    .where(
      and(
        eq(collections.ownerId, userId),
        eq(items.ownerId, userId),
        inArray(itemCollections.collectionId, collectionIds),
      ),
    )
    .groupBy(
      itemCollections.collectionId,
      itemTypes.id,
      itemTypes.key,
      itemTypes.name,
      itemTypes.color,
      itemTypes.icon,
    );
}

/** Cards rendered by the recent-collections grid and the sidebar's recents list. */
export const RECENT_COLLECTIONS_LIMIT = 4;

/** Both dashboard collection surfaces plus the shared type breakdown. */
export type DashboardCollections = {
  sidebar: SidebarCollections;
  recent: CollectionSummary[];
};

/**
 * Both collection surfaces from one bounded read each, with a single type
 * breakdown over their union. Memoized per request so the layout's sidebar and
 * the page's cards share the same rows and cannot disagree about a count or a
 * dominant color.
 */
export const getDashboardCollections = cache(
  async (
    userId: string,
    recentLimit: number = RECENT_COLLECTIONS_LIMIT,
  ): Promise<DashboardCollections> => {
    const [sidebarRows, recentRows] = await Promise.all([
      sidebarCollectionsQuery(userId, recentLimit),
      recentCollectionsQuery(userId, recentLimit),
    ]);

    const collectionIds = [
      ...new Set([...sidebarRows, ...recentRows].map((row) => row.id)),
    ];

    const typeRows =
      collectionIds.length === 0
        ? []
        : await collectionTypeBreakdownQuery(userId, collectionIds);

    return {
      sidebar: buildSidebarCollections(
        sidebarRows,
        buildCollectionSummaries(sidebarRows, typeRows),
      ),
      recent: buildCollectionSummaries(recentRows, typeRows),
    };
  },
);

/** Recent collections with item counts and per-type usage, newest first. */
export async function getRecentCollections(
  userId: string,
  limit: number = RECENT_COLLECTIONS_LIMIT,
): Promise<CollectionSummary[]> {
  const { recent } = await getDashboardCollections(userId, limit);
  return recent;
}

/**
 * The sidebar's collections — every favorite plus the four most recent
 * non-favorites — with the favorite flag and dominant-type color it renders.
 * The same `updatedAt`/`name`/`id` ordering as the main-area cards keeps both
 * surfaces deterministic.
 */
export function sidebarCollectionsQuery(
  userId: string,
  recentLimit: number = RECENT_COLLECTIONS_LIMIT,
) {
  const recentIds = db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(
        eq(collections.ownerId, userId),
        eq(collections.isFavorite, false),
      ),
    )
    .orderBy(
      desc(collections.updatedAt),
      asc(collections.name),
      asc(collections.id),
    )
    .limit(recentLimit);

  return db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isFavorite: collections.isFavorite,
    })
    .from(collections)
    .where(
      and(
        eq(collections.ownerId, userId),
        or(eq(collections.isFavorite, true), inArray(collections.id, recentIds)),
      ),
    )
    .orderBy(
      desc(collections.updatedAt),
      asc(collections.name),
      asc(collections.id),
    );
}

/**
 * Sidebar collections: every favorite plus the four most recent non-favorites,
 * each with its dominant item-type color for the recent-collection dot.
 */
export async function getSidebarCollections(
  userId: string,
): Promise<SidebarCollections> {
  const { sidebar } = await getDashboardCollections(
    userId,
    RECENT_COLLECTIONS_LIMIT,
  );
  return sidebar;
}

/** Rolling window for `addedThisWeek`: the last seven days, not the calendar week. */
export const ADDED_THIS_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** `count(*) filter (where …)`, mapped to a number like Drizzle's `count()`. */
function countWhere(condition: SQLWrapper): SQL<number> {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

/**
 * Owner-scoped item totals in one aggregate: all items, favorites, and the
 * rolling seven-day count. The owner predicate stays in `where`, outside the
 * filters, so foreign rows never reach the aggregate.
 */
export function itemTotalsQuery(userId: string, since: Date) {
  return db
    .select({
      items: count(),
      favoriteItems: countWhere(eq(items.isFavorite, true)),
      addedThisWeek: countWhere(gte(items.createdAt, since)),
    })
    .from(items)
    .where(eq(items.ownerId, userId));
}

/** Owner-scoped collection totals in one aggregate: all and favorites. */
export function collectionTotalsQuery(userId: string) {
  return db
    .select({
      collections: count(),
      favoriteCollections: countWhere(eq(collections.isFavorite, true)),
    })
    .from(collections)
    .where(eq(collections.ownerId, userId));
}

/** Start of the rolling seven-day window, relative to `now`. */
export function getAddedThisWeekSince(now = new Date()): Date {
  return new Date(now.getTime() - ADDED_THIS_WEEK_MS);
}

/**
 * Owner-scoped totals for the dashboard header and all four stat cards, from
 * one aggregate per table. Memoized per request so the layout's favorite-item
 * count and the page's stat cards share the same read instead of hitting the
 * database twice.
 */
export const getDashboardCounts = cache(
  async (userId: string): Promise<DashboardCounts> => {
    const since = getAddedThisWeekSince();

    const [itemRows, collectionRows] = await Promise.all([
      itemTotalsQuery(userId, since),
      collectionTotalsQuery(userId),
    ]);

    const itemTotals = itemRows[0];
    const collectionTotals = collectionRows[0];

    return {
      items: itemTotals?.items ?? 0,
      collections: collectionTotals?.collections ?? 0,
      favoriteItems: itemTotals?.favoriteItems ?? 0,
      favoriteCollections: collectionTotals?.favoriteCollections ?? 0,
      addedThisWeek: itemTotals?.addedThisWeek ?? 0,
    };
  },
);
