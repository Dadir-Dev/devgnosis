import "server-only";

import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";

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

/** Recent collections with item counts and per-type usage, newest first. */
export async function getRecentCollections(
  userId: string,
  limit = 4,
): Promise<CollectionSummary[]> {
  const collectionRows = await recentCollectionsQuery(userId, limit);
  if (collectionRows.length === 0) return [];

  const typeRows = await collectionTypeBreakdownQuery(
    userId,
    collectionRows.map((row) => row.id),
  );

  return buildCollectionSummaries(collectionRows, typeRows);
}

/**
 * All owner collections, newest first, with the favorite flag needed by the
 * sidebar. The same `updatedAt`/`name`/`id` ordering as the main-area cards
 * keeps both surfaces deterministic.
 */
export function sidebarCollectionsQuery(userId: string) {
  return db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isFavorite: collections.isFavorite,
    })
    .from(collections)
    .where(eq(collections.ownerId, userId))
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
  const collectionRows = await sidebarCollectionsQuery(userId);
  if (collectionRows.length === 0) return { favorites: [], recents: [] };

  const typeRows = await collectionTypeBreakdownQuery(
    userId,
    collectionRows.map((row) => row.id),
  );

  return buildSidebarCollections(
    collectionRows,
    buildCollectionSummaries(collectionRows, typeRows),
  );
}

/** Rolling window for `addedThisWeek`: the last seven days, not the calendar week. */
export const ADDED_THIS_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Owner-scoped item total for the dashboard header and stats. */
export function itemCountQuery(userId: string) {
  return db
    .select({ value: count() })
    .from(items)
    .where(eq(items.ownerId, userId));
}

/** Owner-scoped collection total for the dashboard header and stats. */
export function collectionCountQuery(userId: string) {
  return db
    .select({ value: count() })
    .from(collections)
    .where(eq(collections.ownerId, userId));
}

/** Owner-scoped count of favorite items. */
export function favoriteItemCountQuery(userId: string) {
  return db
    .select({ value: count() })
    .from(items)
    .where(and(eq(items.ownerId, userId), eq(items.isFavorite, true)));
}

/** Favorite item total for the sidebar's Favorites link. */
export async function getFavoriteItemCount(userId: string): Promise<number> {
  const [row] = await favoriteItemCountQuery(userId);
  return row?.value ?? 0;
}

/** Owner-scoped count of favorite collections. */
export function favoriteCollectionCountQuery(userId: string) {
  return db
    .select({ value: count() })
    .from(collections)
    .where(and(eq(collections.ownerId, userId), eq(collections.isFavorite, true)));
}

/** Owner-scoped count of items created at or after `since`. */
export function addedThisWeekQuery(userId: string, since: Date) {
  return db
    .select({ value: count() })
    .from(items)
    .where(and(eq(items.ownerId, userId), gte(items.createdAt, since)));
}

/** Start of the rolling seven-day window, relative to `now`. */
export function getAddedThisWeekSince(now = new Date()): Date {
  return new Date(now.getTime() - ADDED_THIS_WEEK_MS);
}

/** Owner-scoped totals for the dashboard header and all four stat cards. */
export async function getDashboardCounts(
  userId: string,
): Promise<DashboardCounts> {
  const since = getAddedThisWeekSince();

  const [
    itemRows,
    collectionRows,
    favoriteItemRows,
    favoriteCollectionRows,
    addedThisWeekRows,
  ] = await Promise.all([
    itemCountQuery(userId),
    collectionCountQuery(userId),
    favoriteItemCountQuery(userId),
    favoriteCollectionCountQuery(userId),
    addedThisWeekQuery(userId, since),
  ]);

  return {
    items: itemRows[0]?.value ?? 0,
    collections: collectionRows[0]?.value ?? 0,
    favoriteItems: favoriteItemRows[0]?.value ?? 0,
    favoriteCollections: favoriteCollectionRows[0]?.value ?? 0,
    addedThisWeek: addedThisWeekRows[0]?.value ?? 0,
  };
}
